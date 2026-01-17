/**
 * IPC Handlers for Drop Zone
 * Handles file drop events and imports files to IDDI
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import log from 'electron-log';
import * as fs from 'fs';
import * as path from 'path';
import { IpcResponse } from '../../shared/types/ipc';

/**
 * Drop zone handlers class
 */
export class DropZoneHandlers {
  private static instance: DropZoneHandlers | null = null;
  private importPath: string = 'D:\\iddoc_Import';

  private constructor() {
    log.info('[DropZoneHandlers] Initialized');
    this.ensureImportDirectoryExists();
    this.registerHandlers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DropZoneHandlers {
    if (!DropZoneHandlers.instance) {
      DropZoneHandlers.instance = new DropZoneHandlers();
    }
    return DropZoneHandlers.instance;
  }

  /**
   * Ensure import directory exists
   */
  private ensureImportDirectoryExists(): void {
    try {
      if (!fs.existsSync(this.importPath)) {
        log.info(`[DropZoneHandlers] Creating import directory: ${this.importPath}`);
        fs.mkdirSync(this.importPath, { recursive: true });
      }
    } catch (error) {
      log.error('[DropZoneHandlers] Error creating import directory:', error);
    }
  }

  /**
   * Copy file to import directory with AnvaDrop- prefix
   */
  private async copyFileToImport(sourceFilePath: string): Promise<{ success: boolean; targetPath?: string; error?: string }> {
    try {
      // Get original filename
      const originalFilename = path.basename(sourceFilePath);

      // Add AnvaDrop- prefix
      const targetFilename = `AnvaDrop-${originalFilename}`;
      const targetPath = path.join(this.importPath, targetFilename);

      log.info(`[DropZoneHandlers] Copying file: ${sourceFilePath} -> ${targetPath}`);

      // Check if source file exists
      if (!fs.existsSync(sourceFilePath)) {
        return {
          success: false,
          error: `Source file not found: ${sourceFilePath}`,
        };
      }

      // Copy file
      fs.copyFileSync(sourceFilePath, targetPath);

      log.info(`[DropZoneHandlers] File copied successfully: ${targetFilename}`);

      return {
        success: true,
        targetPath,
      };
    } catch (error) {
      log.error('[DropZoneHandlers] Error copying file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle file drop from overlay
   */
  private async handleFileDrop(
    event: IpcMainInvokeEvent,
    filePaths: string[]
  ): Promise<IpcResponse<{ imported: number; failed: number; files: string[] }>> {
    log.info(`[DropZoneHandlers] Processing ${filePaths.length} dropped file(s)`);

    let imported = 0;
    let failed = 0;
    const importedFiles: string[] = [];

    for (const filePath of filePaths) {
      const result = await this.copyFileToImport(filePath);
      if (result.success) {
        imported++;
        if (result.targetPath) {
          importedFiles.push(path.basename(result.targetPath));
        }
      } else {
        failed++;
        log.error(`[DropZoneHandlers] Failed to import ${filePath}: ${result.error}`);
      }
    }

    log.info(`[DropZoneHandlers] Import complete: ${imported} success, ${failed} failed`);

    return {
      success: true,
      data: {
        imported,
        failed,
        files: importedFiles,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Register IPC handlers
   */
  private registerHandlers(): void {
    ipcMain.handle('dropzone-handle-file-drop', this.handleFileDrop.bind(this));
    log.info('[DropZoneHandlers] Handlers registered');
  }

  /**
   * Cleanup
   */
  public cleanup(): void {
    ipcMain.removeHandler('dropzone-handle-file-drop');
    log.info('[DropZoneHandlers] Handlers cleaned up');
  }

  /**
   * Destroy singleton
   */
  public static destroyInstance(): void {
    if (DropZoneHandlers.instance) {
      DropZoneHandlers.instance.cleanup();
      DropZoneHandlers.instance = null;
      log.info('[DropZoneHandlers] Instance destroyed');
    }
  }
}

/**
 * Initialize drop zone handlers
 */
export function initializeDropZoneHandlers(): void {
  DropZoneHandlers.getInstance();
  log.info('Drop zone handlers initialized');
}

/**
 * Cleanup drop zone handlers
 */
export function cleanupDropZoneHandlers(): void {
  DropZoneHandlers.destroyInstance();
  log.info('Drop zone handlers cleaned up');
}
