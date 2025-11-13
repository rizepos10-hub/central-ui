#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function findAndFixNumberInputs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let fixCount = 0;

  // Split content into lines for better tracking
  const lines = content.split('\n');
  const modifiedLines = [];
  let inNumberInput = false;
  let bracketDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Check if we're starting a number input
    if (line.includes('type="number"') || line.includes("type='number'") ||
        line.includes('type={"number"}') || line.includes("type={'number'}")) {
      inNumberInput = true;
      bracketDepth = 0;
    }

    // Track bracket depth to know when the input element ends
    if (inNumberInput) {
      for (const char of line) {
        if (char === '{') bracketDepth++;
        if (char === '}') bracketDepth--;
      }

      // Check for the problematic pattern in value prop
      if (line.includes('value={') && (line.includes(' || \'\'') || line.includes(' || ""'))) {
        // Fix the pattern: replace || with ??
        const originalLine = line;
        line = line.replace(/ \|\| ''/g, ' ?? \'\'');
        line = line.replace(/ \|\| ""/g, ' ?? ""');

        if (line !== originalLine) {
          modified = true;
          fixCount++;
          console.log(`${colors.cyan}  Line ${i + 1}: Fixed number input value${colors.reset}`);
        }
      }

      // Check if we've closed the input tag
      if (line.includes('/>') || line.includes('</Input>') ||
          (line.includes('>') && !line.includes('onChange') && !line.includes('value='))) {
        inNumberInput = false;
      }
    }

    modifiedLines.push(line);
  }

  if (modified) {
    fs.writeFileSync(filePath, modifiedLines.join('\n'));
  }

  return { modified, fixCount };
}

function processFiles() {
  console.log(`${colors.bright}${colors.blue}Searching for TypeScript/React files with number inputs...${colors.reset}\n`);

  // Find all .tsx and .jsx files in src directory
  const patterns = [
    'src/**/*.tsx',
    'src/**/*.jsx',
    'components/**/*.tsx',
    'components/**/*.jsx'
  ];

  let files = [];
  for (const pattern of patterns) {
    const found = glob.sync(pattern.replace(/\\/g, '/'), {
      ignore: ['**/node_modules/**', '**/.history/**', '**/dist/**', '**/build/**']
    });
    files = files.concat(found);
  }

  console.log(`Found ${files.length} files to check\n`);

  let totalFixed = 0;
  let filesModified = 0;
  const modifiedFiles = [];

  for (const file of files) {
    const fileContent = fs.readFileSync(file, 'utf8');

    // Quick check if file has number inputs
    if (!fileContent.includes('type="number"') &&
        !fileContent.includes("type='number'") &&
        !fileContent.includes('type={"number"}') &&
        !fileContent.includes("type={'number'}")) {
      continue;
    }

    // Check if file has the problematic pattern
    if (!fileContent.includes(' || \'\'') && !fileContent.includes(' || ""')) {
      continue;
    }

    console.log(`${colors.yellow}Checking: ${file}${colors.reset}`);
    const result = findAndFixNumberInputs(file);

    if (result.modified) {
      totalFixed += result.fixCount;
      filesModified++;
      modifiedFiles.push(file);
      console.log(`${colors.green}  ✓ Fixed ${result.fixCount} issue(s)${colors.reset}\n`);
    } else {
      console.log(`  No issues found\n`);
    }
  }

  // Print summary
  console.log(`${colors.bright}${colors.green}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`${colors.green}✓ Fixed ${totalFixed} number input(s) in ${filesModified} file(s)${colors.reset}\n`);

  if (modifiedFiles.length > 0) {
    console.log(`${colors.bright}Modified files:${colors.reset}`);
    modifiedFiles.forEach(file => {
      console.log(`  ${colors.cyan}• ${file}${colors.reset}`);
    });
  }
}

// Check if glob is installed
try {
  require.resolve('glob');
} catch (e) {
  console.error(`${colors.yellow}Warning: 'glob' package is not installed.${colors.reset}`);
  console.log('Installing glob package...');
  const { execSync } = require('child_process');
  execSync('npm install glob', { stdio: 'inherit' });
}

// Run the script
try {
  processFiles();
} catch (error) {
  console.error(`${colors.bright}${colors.yellow}Error: ${error.message}${colors.reset}`);
  process.exit(1);
}