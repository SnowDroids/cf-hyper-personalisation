/**
 * Post-build script to add Durable Object export to the worker
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workerPath = path.join(__dirname, '../.open-next/worker.js');
const doSourcePath = path.join(__dirname, '../src/durable-objects/ReportAnalyzer.ts');
const doDestPath = path.join(__dirname, '../.open-next/ReportAnalyzer.js');

// Compile the Durable Object file using esbuild
if (fs.existsSync(doSourcePath)) {
  try {
    // First, create a temporary file with the proper import
    let doContent = fs.readFileSync(doSourcePath, 'utf8');
    
    // Replace the declare statement with actual import
    doContent = doContent.replace(
      /\/\/ DurableObject is available globally[\s\S]*?declare const DurableObject: any;/,
      "import { DurableObject } from 'cloudflare:workers';"
    );
    
    const tempPath = path.join(__dirname, '../.open-next/ReportAnalyzer.temp.ts');
    
    // Clean up any existing temp file first
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    fs.writeFileSync(tempPath, doContent);
    
    // Use esbuild to compile TypeScript to JavaScript
    const esbuildCmd = `npx esbuild "${tempPath}" --bundle --outfile="${doDestPath}" --format=esm --target=es2022 --external:cloudflare:workers --platform=neutral`;
    execSync(esbuildCmd, { stdio: 'inherit' });
    
    // Clean up temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    console.log('✓ Compiled Durable Object to .open-next directory');
  } catch (error) {
    console.error('✗ Failed to compile Durable Object:', error.message);
    process.exit(1);
  }
} else {
  console.error('✗ Durable Object source not found at:', doSourcePath);
  process.exit(1);
}

// Inline the Durable Object code into the worker
if (fs.existsSync(workerPath) && fs.existsSync(doDestPath)) {
  // Read both files
  let workerContent = fs.readFileSync(workerPath, 'utf8');
  let doCode = fs.readFileSync(doDestPath, 'utf8');
  
  // Remove the export statement from the DO code
  doCode = doCode.replace(/^export\s*\{[\s\S]*?\};?\s*$/m, '');
  
  // Extract the import statement and remove it from doCode
  const importMatch = doCode.match(/import\s*\{[^}]+\}\s*from\s*["'][^"']+["'];?\s*/);
  let importStatement = '';
  if (importMatch) {
    importStatement = importMatch[0];
    doCode = doCode.replace(importMatch[0], '');
  }
  
  // Convert var ReportAnalyzer = class to class ReportAnalyzer
  doCode = doCode.replace(/var\s+ReportAnalyzer\s*=\s*class/g, 'class ReportAnalyzer');
  
  // Add the import at the top of the file (after any existing imports)
  if (importStatement) {
    workerContent = workerContent.replace(
      /(import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*)+/,
      '$&' + importStatement + '\n'
    );
  }
  
  // Add the Durable Object code before the default export
  const durableObjectSection = `
// ========== WORKSHOP: DURABLE OBJECT CODE START ==========
${doCode}
// ========== WORKSHOP: DURABLE OBJECT CODE END ==========

`;
  
  // Insert before the "export default" statement
  workerContent = workerContent.replace(
    /(export default \{)/,
    durableObjectSection + '$1'
  );
  
  // Add export statement at the end
  workerContent += '\n// ========== WORKSHOP: DURABLE OBJECT EXPORT START ==========\nexport { ReportAnalyzer };\n// ========== WORKSHOP: DURABLE OBJECT EXPORT END ==========\n';
  
  // Write back
  fs.writeFileSync(workerPath, workerContent);
  console.log('✓ Inlined Durable Object into worker');
  
  // Clean up the separate DO file
  fs.unlinkSync(doDestPath);
} else {
  console.error('✗ Worker or Durable Object file not found');
  process.exit(1);
}
