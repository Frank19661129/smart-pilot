/**
 * Build script for preload - bundles with esbuild
 * Inlines all dependencies to work in Electron's sandboxed preload context
 */

const esbuild = require('esbuild');
const path = require('path');

async function buildPreload() {
  console.log('Building preload script with esbuild...');

  try {
    await esbuild.build({
      entryPoints: [path.join(__dirname, '../src/preload/preload.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile: path.join(__dirname, '../dist/main/preload/preload.js'),
      external: ['electron'],
      sourcemap: true,
      format: 'cjs',
      logLevel: 'info',
    });

    console.log('✓ Preload script built successfully');
  } catch (error) {
    console.error('✗ Failed to build preload script:', error);
    process.exit(1);
  }
}

buildPreload();
