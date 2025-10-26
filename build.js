#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, copyFileSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join, basename, dirname } from 'path';

console.log('🚀 Virtual Keyboard Build Script');
console.log('================================');

// Check if TypeScript is installed
try {
  execSync('npx tsc --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ TypeScript is not installed, please run: npm install');
  process.exit(1);
}

// Clean old dist directory
console.log('🧹 Cleaning old build files...');
if (existsSync('dist')) {
  rmSync('dist', { recursive: true, force: true });
}

// Run TypeScript compilation
console.log('🔨 Compiling TypeScript files...');
try {
  execSync('npx tsc', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation successful!');
} catch (error) {
  console.error('❌ TypeScript compilation failed:', error.message);
  process.exit(1);
}

// Copy static files
console.log('📁 Copying static files...');

// Get all files from src directory
function getAllSrcFiles(dir, basePath = '') {
  const files = [];
  const items = readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = join(dir, item);
    const relativePath = join(basePath, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllSrcFiles(fullPath, relativePath));
    } else {
      files.push(relativePath);
    }
  });
  
  return files;
}

const allFiles = getAllSrcFiles('src');
const staticFiles = allFiles.filter(file => 
  !file.endsWith('.ts') && 
  !file.endsWith('.js') && 
  file !== 'typescript.svg' // Skip TypeScript logo
);

staticFiles.forEach(file => {
  const srcPath = join('src', file);
  const destPath = join('dist', file);
  
  // Create destination directory if it doesn't exist
  const destDir = dirname(destPath);
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  
  if (existsSync(srcPath)) {
    copyFileSync(srcPath, destPath);
    console.log(`  ✅ Copied ${srcPath} -> ${destPath}`);
  } else {
    console.warn(`  ⚠️  File not found: ${srcPath}`);
  }
});

console.log('\n🎉 Build complete!');
console.log('📂 Output directory: dist/');
console.log('\nUsage:');
console.log('  Development: Open dist/keyboard-demo.html directly');
console.log('  Testing: Use any HTTP server (e.g., npx serve, npx http-server)');