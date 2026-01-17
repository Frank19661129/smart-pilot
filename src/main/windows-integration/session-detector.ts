/**
 * SessionDetector - Detects the type of Windows session
 *
 * MOCK VERSION - Native Windows API requires Visual Studio Build Tools
 * Returns mock data until native dependencies are installed
 */

import log from 'electron-log';
import { SessionContext, SessionType } from '../../shared/types/windows';

/**
 * SessionDetector Class - Mock Implementation
 */
export class SessionDetector {
  private static instance: SessionDetector | null = null;

  private constructor() {
    log.info('[SessionDetector] Initialized (MOCK MODE - Native APIs not available)');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SessionDetector {
    if (!SessionDetector.instance) {
      SessionDetector.instance = new SessionDetector();
    }
    return SessionDetector.instance;
  }

  /**
   * Get current session context
   * MOCK: Returns physical machine session
   */
  async getSessionContext(): Promise<SessionContext> {
    log.info('[SessionDetector] getSessionContext() called (returning mock data)');

    return {
      type: 'physical',
      sessionId: 1,
      hostName: process.env.COMPUTERNAME || 'MOCK-MACHINE',
      isRemote: false,
      metadata: {
        userName: process.env.USERNAME || 'mock-user',
        computerName: process.env.COMPUTERNAME || 'MOCK-MACHINE',
        osVersion: process.platform,
        osArch: process.arch,
        mock: true,
        message: 'Mock data - Install native dependencies for real session detection'
      }
    };
  }

  /**
   * Quick check if session is remote
   * MOCK: Always returns false (physical machine)
   */
  isCurrentSessionRemote(): boolean {
    log.info('[SessionDetector] isCurrentSessionRemote() called (returning false - mock physical machine)');
    return false;
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

  /**
   * Cleanup
   */
  public static destroyInstance(): void {
    log.info('[SessionDetector] Destroying instance');
    SessionDetector.instance = null;
  }
}

export default SessionDetector;
