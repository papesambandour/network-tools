#!/usr/bin/env node

/**
 * Sync Version Script
 * Synchronizes version between root package.json and client/package.json
 */

const fs = require('fs');
const path = require('path');

// Paths
const rootPackagePath = path.join(__dirname, '..', 'package.json');
const clientPackagePath = path.join(__dirname, '..', 'client', 'package.json');

// Read package.json files
function readJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    process.exit(1);
  }
}

// Write package.json files
function writeJSON(filePath, data) {
  try {
    const content = JSON.stringify(data, null, 2) + '\n';
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Updated ${path.relative(process.cwd(), filePath)}`);
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
    process.exit(1);
  }
}

// Main function
function syncVersion() {
  console.log('Synchronizing versions...\n');

  // Read both package.json files
  const rootPackage = readJSON(rootPackagePath);
  const clientPackage = readJSON(clientPackagePath);

  const rootVersion = rootPackage.version;
  const clientVersion = clientPackage.version;

  console.log(`Root package version:   ${rootVersion}`);
  console.log(`Client package version: ${clientVersion}\n`);

  // Check if versions are already in sync
  if (rootVersion === clientVersion) {
    console.log('✓ Versions are already in sync!');
    return;
  }

  // Sync client version with root version
  clientPackage.version = rootVersion;
  writeJSON(clientPackagePath, clientPackage);

  console.log(`\n✓ Successfully synced version to ${rootVersion}`);
}

// Run the script
syncVersion();