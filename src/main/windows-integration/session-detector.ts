/**
 * SessionDetector - Detects the type of Windows session
 *
 * Determines if running on:
 * - Physical Windows machine
 * - Azure Virtual Desktop (AVD)
 * - Citrix Virtual Apps/Desktops
 * - Windows Terminal Server/RDS
 * - Generic RDP session
 */

import ffi from 'ffi-napi';
import ref from 'ref-napi';
import StructType from 'ref-struct-napi';
import { SessionContext, SessionType } from '../../shared/types/windows';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Windows API types
const BOOL = ref.types.bool;
const DWORD = ref.types.uint32;
const LPWSTR = ref.refType(ref.types.CString);
const HANDLE = ref.refType('void');

// WTS Session Info Class
const WTS_INFO_CLASS = {
  WTSInitialProgram: 0,
  WTSApplicationName: 1,
  WTSWorkingDirectory: 2,
  WTSOEMId: 3,
  WTSSessionId: 4,
  WTSUserName: 5,
  WTSWinStationName: 6,
  WTSDomainName: 7,
  WTSConnectState: 8,
  WTSClientBuildNumber: 9,
  WTSClientName: 10,
  WTSClientDirectory: 11,
  WTSClientProductId: 12,
  WTSClientHardwareId: 13,
  WTSClientAddress: 14,
  WTSClientDisplay: 15,
  WTSClientProtocolType: 16,
};

// WTS Protocol Types
const WTS_PROTOCOL_TYPE = {
  WTS_PROTOCOL_TYPE_CONSOLE: 0,
  WTS_PROTOCOL_TYPE_ICA: 1,
  WTS_PROTOCOL_TYPE_RDP: 2,
};

/**
 * Windows Kernel32.dll bindings
 */
const kernel32 = ffi.Library('kernel32.dll', {
  'GetCurrentProcessId': [DWORD, []],
  'ProcessIdToSessionId': [BOOL, [DWORD, ref.refType(DWORD)]],
  'GetSystemMetrics': [ref.types.int, [ref.types.int]],
});

/**
 * Windows wtsapi32.dll bindings for Terminal Services
 */
const wtsapi32 = ffi.Library('wtsapi32.dll', {
  'WTSQuerySessionInformationW': [BOOL, [HANDLE, DWORD, DWORD, ref.refType(LPWSTR), ref.refType(DWORD)]],
  'WTSFreeMemory': [ref.types.void, [LPWSTR]],
  'WTSGetActiveConsoleSessionId': [DWORD, []],
});

// System Metrics constants
const SM_REMOTESESSION = 0x1000;

/**
 * Registry helper for detecting virtual environments
 */
class RegistryHelper {
  /**
   * Check if a registry key exists and optionally get its value
   */
  static async queryRegistry(path: string, value?: string): Promise<string | null> {
    try {
      const command = value
        ? `reg query "${path}" /v "${value}"`
        : `reg query "${path}"`;

      const { stdout } = await execAsync(command, { timeout: 5000 });
      return stdout;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check for AVD-specific registry keys
   */
  static async isAVD(): Promise<boolean> {
    // Check for Azure Virtual Desktop markers
    const avdKeys = [
      'HKLM\\SOFTWARE\\Microsoft\\RDInfraAgent',
      'HKLM\\SOFTWARE\\Microsoft\\Terminal Server Client\\Default\\AddIns\\WebRTC Redirector',
      'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server\\AddIns\\Azure Virtual Desktop',
    ];

    for (const key of avdKeys) {
      const result = await this.queryRegistry(key);
      if (result) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for Citrix-specific registry keys and processes
   */
  static async isCitrix(): Promise<boolean> {
    // Check for Citrix registry keys
    const citrixKeys = [
      'HKLM\\SOFTWARE\\Citrix\\ICA Client',
      'HKLM\\SOFTWARE\\Wow6432Node\\Citrix\\ICA Client',
      'HKLM\\SYSTEM\\CurrentControlSet\\Services\\CtxSbx',
    ];

    for (const key of citrixKeys) {
      const result = await this.queryRegistry(key);
      if (result) {
        return true;
      }
    }

    // Check for Citrix processes
    try {
      const { stdout } = await execAsync('tasklist', { timeout: 5000 });
      const citrixProcesses = ['wfshell.exe', 'receiver.exe', 'concentr.exe', 'wfica32.exe'];
      const lowerOutput = stdout.toLowerCase();

      for (const process of citrixProcesses) {
        if (lowerOutput.includes(process.toLowerCase())) {
          return true;
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return false;
  }

  /**
   * Check for VMware Horizon
   */
  static async isVMwareHorizon(): Promise<boolean> {
    const horizonKeys = [
      'HKLM\\SOFTWARE\\VMware, Inc.\\VMware VDM',
      'HKLM\\SOFTWARE\\VMware, Inc.\\VMware Blast',
    ];

    for (const key of horizonKeys) {
      const result = await this.queryRegistry(key);
      if (result) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get environment variable
   */
  static getEnvVar(name: string): string | undefined {
    return process.env[name];
  }
}

export class SessionDetector {
  private sessionId: number = 0;
  private isRemote: boolean = false;
  private protocolType: number = 0;

  /**
   * Get current session context
   */
  async getSessionContext(): Promise<SessionContext> {
    try {
      // Get current session ID
      this.sessionId = await this.getCurrentSessionId();

      // Check if session is remote using System Metrics
      this.isRemote = this.isRemoteSession();

      // Get protocol type and client info
      const clientName = await this.getClientName();
      this.protocolType = await this.getProtocolType();

      // Determine session type
      const sessionType = await this.determineSessionType();

      // Get hostname
      const hostName = await this.getHostName();

      // Determine protocol
      const protocol = this.determineProtocol();

      // Collect metadata
      const metadata = await this.collectMetadata();

      return {
        type: sessionType,
        sessionId: this.sessionId,
        hostName,
        isRemote: this.isRemote,
        clientName: clientName || undefined,
        protocol,
        metadata
      };
    } catch (error) {
      // Return safe defaults on error
      return {
        type: 'unknown',
        sessionId: 0,
        isRemote: false,
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * Get current session ID
   */
  private async getCurrentSessionId(): Promise<number> {
    try {
      const processId = kernel32.GetCurrentProcessId();
      const sessionIdBuffer = ref.alloc(DWORD);

      const result = kernel32.ProcessIdToSessionId(processId, sessionIdBuffer);

      if (result) {
        return sessionIdBuffer.readUInt32LE(0);
      }

      // Fallback to WTS API
      return wtsapi32.WTSGetActiveConsoleSessionId();
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if current session is remote using GetSystemMetrics
   */
  private isRemoteSession(): boolean {
    try {
      // SM_REMOTESESSION returns non-zero for RDP sessions
      const result = kernel32.GetSystemMetrics(SM_REMOTESESSION);
      return result !== 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get WTS session information
   */
  private async getWTSSessionInfo(infoClass: number): Promise<string | null> {
    try {
      const WTS_CURRENT_SERVER_HANDLE = ref.NULL;
      const WTS_CURRENT_SESSION = -1;

      const bufferPtr = ref.alloc(LPWSTR);
      const bytesReturned = ref.alloc(DWORD);

      const result = wtsapi32.WTSQuerySessionInformationW(
        WTS_CURRENT_SERVER_HANDLE,
        WTS_CURRENT_SESSION,
        infoClass,
        bufferPtr,
        bytesReturned
      );

      if (result) {
        const buffer = bufferPtr.deref();
        if (!ref.isNull(buffer)) {
          const value = buffer.toString('ucs2').replace(/\0/g, '');
          wtsapi32.WTSFreeMemory(buffer);
          return value;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get client name for remote sessions
   */
  private async getClientName(): Promise<string | null> {
    return this.getWTSSessionInfo(WTS_INFO_CLASS.WTSClientName);
  }

  /**
   * Get protocol type
   */
  private async getProtocolType(): Promise<number> {
    try {
      const protocol = await this.getWTSSessionInfo(WTS_INFO_CLASS.WTSClientProtocolType);
      if (protocol) {
        return parseInt(protocol, 10);
      }
    } catch (error) {
      // Ignore
    }
    return WTS_PROTOCOL_TYPE.WTS_PROTOCOL_TYPE_CONSOLE;
  }

  /**
   * Determine protocol name
   */
  private determineProtocol(): SessionContext['protocol'] {
    if (!this.isRemote) {
      return undefined;
    }

    switch (this.protocolType) {
      case WTS_PROTOCOL_TYPE.WTS_PROTOCOL_TYPE_ICA:
        return 'ICA';
      case WTS_PROTOCOL_TYPE.WTS_PROTOCOL_TYPE_RDP:
        return 'RDP';
      default:
        return 'Unknown';
    }
  }

  /**
   * Determine session type (AVD, Citrix, RDS, etc.)
   */
  private async determineSessionType(): Promise<SessionType> {
    // If not remote, it's physical
    if (!this.isRemote) {
      return 'physical';
    }

    // Check for Azure Virtual Desktop
    const isAVD = await RegistryHelper.isAVD();
    if (isAVD) {
      return 'avd';
    }

    // Check for Citrix
    const isCitrix = await RegistryHelper.isCitrix();
    if (isCitrix) {
      return 'citrix';
    }

    // Check for VMware Horizon
    const isVMware = await RegistryHelper.isVMwareHorizon();
    if (isVMware) {
      return 'terminal-server'; // Classify VMware as terminal-server
    }

    // Check protocol type
    if (this.protocolType === WTS_PROTOCOL_TYPE.WTS_PROTOCOL_TYPE_RDP) {
      // Could be RDS or generic RDP
      return 'rdp';
    }

    // Check for Terminal Server specific features
    const isTerminalServer = await this.isTerminalServer();
    if (isTerminalServer) {
      return 'terminal-server';
    }

    return 'rdp';
  }

  /**
   * Check if running on Windows Terminal Server / RDS
   */
  private async isTerminalServer(): Promise<boolean> {
    try {
      // Check for Terminal Server role
      const tsKey = 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server';
      const result = await RegistryHelper.queryRegistry(tsKey, 'TSEnabled');

      if (result && result.includes('0x1')) {
        return true;
      }

      // Check SESSIONNAME environment variable
      const sessionName = RegistryHelper.getEnvVar('SESSIONNAME');
      if (sessionName && sessionName !== 'Console') {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get hostname (local or remote)
   */
  private async getHostName(): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('hostname', { timeout: 3000 });
      return stdout.trim();
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Collect additional session metadata
   */
  private async collectMetadata(): Promise<Record<string, unknown>> {
    const metadata: Record<string, unknown> = {};

    try {
      // Get username
      const userName = await this.getWTSSessionInfo(WTS_INFO_CLASS.WTSUserName);
      if (userName) {
        metadata.userName = userName;
      }

      // Get domain
      const domain = await this.getWTSSessionInfo(WTS_INFO_CLASS.WTSDomainName);
      if (domain) {
        metadata.domain = domain;
      }

      // Get workstation name
      const workstation = await this.getWTSSessionInfo(WTS_INFO_CLASS.WTSWinStationName);
      if (workstation) {
        metadata.workstation = workstation;
      }

      // Get client build number (for remote sessions)
      if (this.isRemote) {
        const clientBuild = await this.getWTSSessionInfo(WTS_INFO_CLASS.WTSClientBuildNumber);
        if (clientBuild) {
          metadata.clientBuild = clientBuild;
        }

        const clientDirectory = await this.getWTSSessionInfo(WTS_INFO_CLASS.WTSClientDirectory);
        if (clientDirectory) {
          metadata.clientDirectory = clientDirectory;
        }
      }

      // Environment variables
      metadata.sessionName = RegistryHelper.getEnvVar('SESSIONNAME');
      metadata.clientName = RegistryHelper.getEnvVar('CLIENTNAME');
      metadata.computerName = RegistryHelper.getEnvVar('COMPUTERNAME');

      // OS information
      metadata.osVersion = process.platform;
      metadata.osArch = process.arch;

    } catch (error) {
      metadata.metadataError = error instanceof Error ? error.message : String(error);
    }

    return metadata;
  }

  /**
   * Quick check if session is remote (without full context)
   */
  isCurrentSessionRemote(): boolean {
    try {
      return kernel32.GetSystemMetrics(SM_REMOTESESSION) !== 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get session type description
   */
  static getSessionTypeDescription(type: SessionType): string {
    const descriptions: Record<SessionType, string> = {
      'physical': 'Physical Windows Machine',
      'avd': 'Azure Virtual Desktop (AVD)',
      'citrix': 'Citrix Virtual Apps/Desktops',
      'terminal-server': 'Windows Terminal Server / RDS',
      'rdp': 'Remote Desktop Protocol (RDP)',
      'unknown': 'Unknown Session Type'
    };

    return descriptions[type] || 'Unknown';
  }
}
