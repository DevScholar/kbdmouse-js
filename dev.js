import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import url from 'url';

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

// Copy all static files (HTML, CSS) without modification
function copyStaticFiles() {
  log('Copying static files...', 'yellow');
  
  // Create dist directory if it doesn't exist
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }
  
  // Copy HTML files
  const htmlFiles = ['keyboard-demo.html', 'mouse-demo.html', 'error-test.html'];
  htmlFiles.forEach(file => {
    const srcPath = path.join(SRC_DIR, file);
    const destPath = path.join(DIST_DIR, file);
    
    if (fs.existsSync(srcPath)) {
      // Copy without modification - keep original paths
      fs.copyFileSync(srcPath, destPath);
      log(`  ✅ Copied ${file} -> dist/${file}`, 'green');
    }
  });
  
  // Copy CSS files
  const cssFiles = ['qwerty-104-key-keyboard.css'];
  cssFiles.forEach(file => {
    const srcPath = path.join(SRC_DIR, file);
    const destPath = path.join(DIST_DIR, file);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      log(`  ✅ Copied ${file} -> dist/${file}`, 'green');
    }
  });
  
  // Copy keyboard HTML template
  const keyboardHtmlPath = path.join(SRC_DIR, 'qwerty-104-key-keyboard.html');
  const destKeyboardHtmlPath = path.join(DIST_DIR, 'qwerty-104-key-keyboard.html');
  if (fs.existsSync(keyboardHtmlPath)) {
    fs.copyFileSync(keyboardHtmlPath, destKeyboardHtmlPath);
    log(`  ✅ Copied qwerty-104-key-keyboard.html -> dist/qwerty-104-key-keyboard.html`, 'green');
  }
}

// Build project (TypeScript compilation)
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

// Start HTTP server with proper routing
function startServer() {
  log(`Starting HTTP server on port: ${PORT}`, 'yellow');
  
  // Create a simple HTTP server that serves from both root and dist
  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Remove leading slash
    pathname = pathname.substring(1);
    
    // Default to directory listing if root is requested
    if (pathname === '') {
      pathname = '.';
    } else if (pathname === 'dist') {
      pathname = 'dist/keyboard-demo.html';
    }
    
    // Handle requests for dist files
    if (pathname.startsWith('dist/')) {
      const filePath = path.join(__dirname, pathname);
      
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        let contentType = 'text/plain';
        
        switch (ext) {
          case '.html':
            contentType = 'text/html';
            break;
          case '.css':
            contentType = 'text/css';
            break;
          case '.js':
            contentType = 'application/javascript';
            break;
          case '.json':
            contentType = 'application/json';
            break;
        }
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fs.readFileSync(filePath));
      } else {
        // Try to serve .js files without extension
        const jsFilePath = filePath + '.js';
        if (fs.existsSync(jsFilePath)) {
          res.writeHead(200, { 'Content-Type': 'application/javascript' });
          res.end(fs.readFileSync(jsFilePath));
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('File not found');
        }
      }
    } else {
      // Handle requests for root directory files - enable full root access
      const filePath = path.join(__dirname, pathname);
      
      if (fs.existsSync(filePath)) {
        // Serve the requested file from root directory
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // For directories, list contents or serve index.html if exists
          const indexPath = path.join(filePath, 'index.html');
          if (fs.existsSync(indexPath)) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(fs.readFileSync(indexPath));
          } else {
            // List directory contents
            const files = fs.readdirSync(filePath);
            const fileList = files.map(file => {
              const fileStat = fs.statSync(path.join(filePath, file));
              const isDir = fileStat.isDirectory() ? '/' : '';
              return `<li><a href="${pathname}/${file}${isDir}">${file}${isDir}</a></li>`;
            }).join('');
            
            const html = `
              <!DOCTYPE html>
              <html>
              <head><title>Directory: ${pathname}</title></head>
              <body>
                <h1>Directory: ${pathname}</h1>
                <ul>${fileList}</ul>
                <p><a href="/">← Back to root</a></p>
              </body>
              </html>
            `;
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
          }
        } else {
          // Serve file with proper content type
          const ext = path.extname(filePath).toLowerCase();
          let contentType = 'text/plain';
          
          switch (ext) {
            case '.js':
              contentType = 'application/javascript';
              break;
            case '.css':
              contentType = 'text/css';
              break;
            case '.html':
              contentType = 'text/html';
              break;
            case '.json':
              contentType = 'application/json';
              break;
            case '.svg':
              contentType = 'image/svg+xml';
              break;
            case '.png':
              contentType = 'image/png';
              break;
            case '.jpg':
            case '.jpeg':
              contentType = 'image/jpeg';
              break;
            case '.gif':
              contentType = 'image/gif';
              break;
            case '.ico':
              contentType = 'image/x-icon';
              break;
          }
          
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(fs.readFileSync(filePath));
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
    }
  });
  
  server.listen(PORT, () => {
    log(`HTTP server started: http://localhost:${PORT}`, 'green');
    log(`Visit http://localhost:${PORT}/dist/keyboard-demo.html to view the keyboard demo`, 'blue');
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
        } else if (filename.endsWith('.html') || filename.endsWith('.css')) {
          // Static file changed (HTML, CSS), copy only this file
          log(`Static file changed, copying: ${filename}`, 'yellow');
          
          const srcPath = path.join(SRC_DIR, filename);
          const destPath = path.join(DIST_DIR, filename);
          
          if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            log(`  ✅ Copied ${filename} -> dist/${filename}`, 'green');
          }
        }
      } catch (error) {
        log(`File processing failed: ${error.message}`, 'red');
      }
    });
    
    log('Development server started successfully!', 'green');
    log('Press Ctrl+C to stop server', 'yellow');
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      log('Shutting down development environment...', 'yellow');
      server.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      log('Shutting down development environment...', 'yellow');
      server.close();
      process.exit(0);
    });
    
  } catch (error) {
    log(`Startup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});