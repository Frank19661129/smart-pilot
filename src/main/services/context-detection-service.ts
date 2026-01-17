/**
 * Context Detection Service
 * Extracts context information (Relatienummer) from window screenshots using OCR
 */

import { createWorker, Worker } from 'tesseract.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import log from 'electron-log';
import sharp from 'sharp';

const execAsync = promisify(exec);

/**
 * Context information extracted from window
 */
export interface WindowContext {
  relatienummer?: string; // 8-digit relation number
  confidence?: number; // OCR confidence score
  error?: string;
}

/**
 * Context Detection Service
 */
export class ContextDetectionService {
  private static instance: ContextDetectionService | null = null;
  private worker: Worker | null = null;
  private isInitialized: boolean = false;
  private captureExePath: string;

  private constructor() {
    // Path to CaptureWindow.exe
    const isDev = !app.isPackaged;
    this.captureExePath = isDev
      ? path.join(process.cwd(), 'resources', 'bin', 'CaptureWindow.exe')
      : path.join(process.resourcesPath, 'bin', 'CaptureWindow.exe');

    log.info('[ContextDetectionService] Initialized');
    log.info('[ContextDetectionService] CaptureWindow.exe path:', this.captureExePath);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ContextDetectionService {
    if (!ContextDetectionService.instance) {
      ContextDetectionService.instance = new ContextDetectionService();
    }
    return ContextDetectionService.instance;
  }

  /**
   * Initialize OCR worker
   */
  private async initializeOCR(): Promise<void> {
    if (this.isInitialized && this.worker) {
      return;
    }

    log.info('[ContextDetectionService] Initializing Tesseract OCR worker...');

    this.worker = await createWorker('nld', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          log.debug(`[ContextDetectionService] OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    this.isInitialized = true;
    log.info('[ContextDetectionService] OCR worker initialized');
  }

  /**
   * Capture window screenshot
   */
  private async captureWindow(windowHandle: number): Promise<string> {
    log.info(`[ContextDetectionService] Capturing window ${windowHandle}`);

    const { stdout, stderr } = await execAsync(`"${this.captureExePath}" ${windowHandle}`, {
      timeout: 10000,
      maxBuffer: 2 * 1024 * 1024,
    });

    if (stderr) {
      log.warn('[ContextDetectionService] stderr:', stderr);
      throw new Error(stderr);
    }

    const result = JSON.parse(stdout.trim());
    if (!result.success) {
      throw new Error('Failed to capture window');
    }

    log.info(`[ContextDetectionService] Screenshot saved to: ${result.outputPath}`);
    return result.outputPath;
  }

  /**
   * Preprocess image for better OCR results
   */
  private async preprocessImage(imagePath: string): Promise<string> {
    const preprocessedPath = imagePath.replace('.png', '_preprocessed.png');

    log.info(`[ContextDetectionService] Preprocessing image for OCR...`);

    // Minimal preprocessing: only resize for better OCR on small text
    // Keep original colors - grayscale makes it worse!
    await sharp(imagePath)
      .resize(null, 2400, { // Scale up to 2400px height
        withoutEnlargement: false,
        fit: 'inside',
        kernel: sharp.kernel.lanczos3, // High quality scaling
      })
      .toFile(preprocessedPath);

    log.info(`[ContextDetectionService] Preprocessed image saved: ${preprocessedPath}`);
    return preprocessedPath;
  }

  /**
   * Extract text from image using OCR
   */
  private async performOCR(imagePath: string): Promise<string> {
    if (!this.worker) {
      await this.initializeOCR();
    }

    log.info(`[ContextDetectionService] Performing OCR on: ${imagePath}`);

    // Preprocess the image for better OCR
    const preprocessedPath = await this.preprocessImage(imagePath);

    // Use PSM 11 (sparse text) to find ALL text on the page, including headers
    await this.worker!.setParameters({
      tessedit_pageseg_mode: 11 as any, // Sparse text - find as much text as possible
    });

    const { data } = await this.worker!.recognize(preprocessedPath);

    log.debug('[ContextDetectionService] OCR completed');
    log.debug(`[ContextDetectionService] Confidence: ${data.confidence}%`);

    return data.text;
  }

  /**
   * Extract Relatienummer from OCR text
   * Pattern: Line with BOTH "Relatie" AND "Portefeuille", then 2 lines down is the 8-digit number
   */
  private extractRelatienummer(text: string): WindowContext {
    log.debug('[ContextDetectionService] Extracting Relatienummer from OCR text');
    log.debug('[ContextDetectionService] Text length:', text.length);

    // Normalize text
    const normalized = text.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n').map(l => l.trim()).filter(l => l);

    log.debug('[ContextDetectionService] Total lines:', lines.length);

    // Find the header line with BOTH "Relatie" AND "Portefeuille"
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this line contains both keywords (table header)
      if (/relatie/i.test(line) && /portefeuille/i.test(line)) {
        log.info(`[ContextDetectionService] Found table header at line ${i}: "${line}"`);

        // The data is 1 line down from the header (Relatie + 1)
        const dataLineIndex = i + 1;

        // Extract 8-digit number from data line
        if (dataLineIndex < lines.length) {
          const dataLine = lines[dataLineIndex];
          log.debug(`[ContextDetectionService] Searching for number in data line ${dataLineIndex}: "${dataLine}"`);

          const match = dataLine.match(/\b(\d{8})\b/);
          if (match) {
            const relatienummer = match[1];
            log.info(`[ContextDetectionService] Found Relatienummer: ${relatienummer}`);
            return {
              relatienummer,
              confidence: 0.9,
            };
          } else {
            log.warn(`[ContextDetectionService] No 8-digit number found in data line ${dataLineIndex}`);
          }
        }
      }
    }

    log.warn('[ContextDetectionService] No table header with "Relatie" + "Portefeuille" found');
    return {
      error: 'No Relatienummer found',
    };
  }

  /**
   * Detect context (Relatienummer) from window
   */
  public async detectContext(windowHandle: number): Promise<WindowContext> {
    try {
      log.info(`[ContextDetectionService] Detecting context for window ${windowHandle}`);

      // Capture screenshot
      const screenshotPath = await this.captureWindow(windowHandle);

      // Perform OCR
      const text = await this.performOCR(screenshotPath);

      // Extract Relatienummer
      const context = this.extractRelatienummer(text);

      // Clean up screenshots
      try {
        const preprocessedPath = screenshotPath.replace('.png', '_preprocessed.png');
        fs.unlinkSync(screenshotPath);
        fs.unlinkSync(preprocessedPath);
        log.debug(`[ContextDetectionService] Cleaned up temporary screenshots`);
      } catch (error) {
        log.warn(`[ContextDetectionService] Failed to delete screenshots: ${error}`);
      }

      return context;
    } catch (error) {
      log.error('[ContextDetectionService] Error detecting context:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Cleanup
   */
  public async cleanup(): Promise<void> {
    if (this.worker) {
      log.info('[ContextDetectionService] Terminating OCR worker...');
      try {
        // Terminate with timeout to prevent hanging
        await Promise.race([
          this.worker.terminate(),
          new Promise((resolve) => setTimeout(resolve, 2000))
        ]);
        log.info('[ContextDetectionService] OCR worker terminated');
      } catch (error) {
        log.warn('[ContextDetectionService] Error terminating worker:', error);
      }
      this.worker = null;
      this.isInitialized = false;
    }
  }

  /**
   * Destroy singleton
   */
  public static async destroyInstance(): Promise<void> {
    if (ContextDetectionService.instance) {
      await ContextDetectionService.instance.cleanup();
      ContextDetectionService.instance = null;
      log.info('[ContextDetectionService] Instance destroyed');
    }
  }
}

export default ContextDetectionService;
