import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = 8080;
const SRC_DIR = 'src';
const DIST_DIR = 'dist';

// Color output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}[${new Date().toLocaleTimeString()}] ${message}${colors.reset}`);
}

// Check if TypeScript files have changed
function hasTypeScriptFilesChanged() {
  try {
    const srcFiles = fs.readdirSync(SRC_DIR, { recursive: true })
      .filter(file => file.endsWith('.ts'))
      .map(file => ({
        path: path.join(SRC_DIR, file),
        mtime: fs.statSync(path.join(SRC_DIR, file)).mtime
      }));
    
    const distFiles = fs.existsSync(DIST_DIR) ? 
      fs.readdirSync(DIST_DIR, { recursive: true })
        .filter(file => file.endsWith('.js'))
        .map(file => ({
          path: path.join(DIST_DIR, file),
          mtime: fs.statSync(path.join(DIST_DIR, file)).mtime
        })) : [];

    // Check if there are new TypeScript files or TypeScript files are newer than corresponding JS files
    for (const srcFile of srcFiles) {
      const correspondingDistFile = srcFile.path.replace(SRC_DIR, DIST_DIR).replace('.ts', '.js');
      const distFile = distFiles.find(f => f.path === correspondingDistFile);
      
      if (!distFile || srcFile.mtime > distFile.mtime) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    log(`Error checking file changes: ${error.message}`, 'red');
    return true; // If error occurs, assume rebuild is needed
  }
}

// Get all files from src directory
function getAllSrcFiles() {
  const files = [];
  
  function traverseDir(dir, basePath = '') {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverseDir(fullPath, relativePath);
      } else {
        files.push(relativePath);
      }
    });
  }
  
  traverseDir(SRC_DIR);
  return files;
}

// Copy a single static file with path fixing
function copyStaticFile(srcFile) {
  const srcPath = path.join(SRC_DIR, srcFile);
  const destPath = path.join(DIST_DIR, srcFile);
  
  // Create destination directory if it doesn't exist
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Special handling for HTML files, fix relative paths
  if (srcFile.endsWith('.html')) {
    let content = fs.readFileSync(srcPath, 'utf8');
    // Since root directory changed to project root, need to adjust path references
    // Change paths relative to src directory to paths relative to project root
    content = content.replace(/from\s+['"]\.\/virtual-key\.js['"]/g, 'from \'./virtual-key.js\'');
    content = content.replace(/from\s+['"]\.\/virtual-keyboard\.js['"]/g, 'from \'./virtual-keyboard.js\'');
    content = content.replace(/from\s+['"]\.\/prefab-virtual-keyboard\.js['"]/g, 'from \'./prefab-virtual-keyboard.js\'');
    content = content.replace(/import\s+['"]\.\/prefab-virtual-keyboard\.js['"]/g, 'import \'./prefab-virtual-keyboard.js\'');
    // Fix paths in attributes
    content = content.replace(/keyboardcsssrc="\.\.\//g, 'keyboardcsssrc="./');
    content = content.replace(/keyboardhtmlsrc="\.\.\//g, 'keyboardhtmlsrc="./');
    content = content.replace(/virtualkeyscriptsrc="\.\.\//g, 'virtualkeyscriptsrc="./');
    content = content.replace(/virtualkeyboardscriptsrc="\.\.\//g, 'virtualkeyboardscriptsrc="./');
    fs.writeFileSync(destPath, content);
    log(`  ✅ Copied and fixed paths ${srcFile} -> ${destPath}`, 'green');
  } else {
    fs.copyFileSync(srcPath, destPath);
    log(`  ✅ Copied ${srcFile} -> ${destPath}`, 'green');
  }
}

// Copy all static files (for initial build)
function copyStaticFiles() {
  log('Copying static files...', 'yellow');
  
  const allFiles = getAllSrcFiles();
  const staticFiles = allFiles.filter(file => 
    !file.endsWith('.ts') && 
    !file.endsWith('.js') && 
    file !== 'typescript.svg' // Skip TypeScript logo
  );
  
  staticFiles.forEach(file => {
    if (fs.existsSync(path.join(SRC_DIR, file))) {
      copyStaticFile(file);
    } else {
      log(`  ⚠️  File not found: ${file}`, 'yellow');
    }
  });
}

// Build project
function buildProject() {
  return new Promise((resolve, reject) => {
    log('Starting build project...', 'yellow');
    
    // Use npx to call tsc
    const tsc = spawn('npx', ['tsc'], { 
      stdio: 'pipe',
      shell: true 
    });
    
    tsc.stdout.on('data', (data) => {
      log(`Build output: ${data.toString().trim()}`, 'blue');
    });
    
    tsc.stderr.on('data', (data) => {
      log(`Build error: ${data.toString().trim()}`, 'red');
    });
    
    tsc.on('close', (code) => {
      if (code === 0) {
        log('TypeScript compilation completed!', 'green');
        // Copy static files after TypeScript compilation
        copyStaticFiles();
        log('Build completed!', 'green');
        resolve();
      } else {
        log(`Build failed, exit code: ${code}`, 'red');
        reject(new Error(`Build failed with code ${code}`));
      }
    });
    
    tsc.on('error', (error) => {
      log(`Build process error: ${error.message}`, 'red');
      reject(error);
    });
  });
}

// Start HTTP server (using Node.js http-server)
function startServer() {
  log(`Starting HTTP server on port: ${PORT}`, 'yellow');
  
  const server = spawn('npx', ['http-server', '.', '-p', PORT.toString(), '-c-1'], { 
    stdio: 'pipe',
    shell: true,
    cwd: process.cwd() // Set to project root directory
  });
  
  server.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output.includes('Starting up http-server')) {
      log(`HTTP server started: http://localhost:${PORT}`, 'green');
    } else if (output.includes('GET')) {
      log(`HTTP request: ${output}`, 'blue');
    }
  });
  
  server.stderr.on('data', (data) => {
    log(`Server error: ${data.toString().trim()}`, 'red');
  });
  
  server.on('close', (code) => {
    log(`HTTP server stopped, exit code: ${code}`, 'yellow');
  });
  
  return server;
}

// Main function
async function main() {
  log('Starting development server...', 'green');
  
  try {
    // Check if dist directory exists
    if (!fs.existsSync(DIST_DIR)) {
      fs.mkdirSync(DIST_DIR, { recursive: true });
      log('Created dist directory', 'blue');
    }
    
    // Initial build
    if (hasTypeScriptFilesChanged()) {
      log('Detected TypeScript file changes, starting build...', 'yellow');
      await buildProject();
    } else {
      log('TypeScript files unchanged, skipping build', 'blue');
      copyStaticFiles();
    }
    
    // Start HTTP server
    const server = startServer();
    
    // File monitoring
    log('Starting file monitoring...', 'blue');
    fs.watch(SRC_DIR, { recursive: true }, async (eventType, filename) => {
      if (!filename) return;
      
      log(`Detected file change: ${filename} (${eventType})`, 'yellow');
      
      try {
        if (filename.endsWith('.ts')) {
          // TypeScript file changed, rebuild entire project
          log('TypeScript file changed, rebuilding project...', 'yellow');
          await buildProject();
          log('Rebuild completed', 'green');
        } else if (!filename.endsWith('.js') && filename !== 'typescript.svg') {
          // Static file changed (HTML, CSS, etc.), copy only this file
          log(`Static file changed, copying: ${filename}`, 'yellow');
          copyStaticFile(filename);
          log('Static file copy completed', 'green');
        }
      } catch (error) {
        log(`File processing failed: ${error.message}`, 'red');
      }
    });
    
    log('Development server started successfully!', 'green');
    log(`Visit http://localhost:${PORT} to view demo`, 'blue');
    log('Press Ctrl+C to stop server', 'yellow');
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      log('Shutting down development environment...', 'yellow');
      server.kill('SIGINT');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      log('Shutting down development environment...', 'yellow');
      server.kill('SIGTERM');
      process.exit(0);
    });
    
  } catch (error) {
    log(`Startup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run main function
main();