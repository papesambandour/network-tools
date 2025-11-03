#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('\n🚀 Starting Network Tools - SSH Tunnel Manager...\n');

// Get the installation directory
const packageRoot = path.join(__dirname, '..');
const serverPath = path.join(packageRoot, 'server', 'index.js');

// Check if server file exists
if (!fs.existsSync(serverPath)) {
  console.error('❌ Error: Server file not found at', serverPath);
  process.exit(1);
}

// Check if client build exists
const clientBuildPath = path.join(packageRoot, 'client', 'build');
if (!fs.existsSync(clientBuildPath)) {
  console.warn('⚠️  Warning: Client build not found. Please run "npm run build" in the client directory.');
}

// Start the server
const serverProcess = spawn('node', [serverPath], {
  stdio: 'inherit',
  cwd: packageRoot,
  env: { ...process.env, NODE_ENV: 'production' }
});

serverProcess.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
  }
  process.exit(code);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down Network Tools...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down Network Tools...');
  serverProcess.kill('SIGTERM');
});
