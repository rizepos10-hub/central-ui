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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function findAndFixOnChangeHandlers(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let fixCount = 0;

  // Split content into lines for better tracking
  const lines = content.split('\n');
  const modifiedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const originalLine = line;

    // Fix parseFloat/parseInt/Number with || pattern in onChange handlers
    // This regex matches parseFloat(something) || value, parseInt(something) || value, Number(something) || value
    const patterns = [
      // parseFloat(e.target.value) || 0 -> parseFloat(e.target.value) ?? 0
      {
        regex: /(parseFloat\([^)]+\))\s*\|\|\s*(0|null)/g,
        replacement: '$1 ?? $2'
      },
      // parseInt(e.target.value) || 0 -> parseInt(e.target.value) ?? 0
      {
        regex: /(parseInt\([^)]+\))\s*\|\|\s*(0|null)/g,
        replacement: '$1 ?? $2'
      },
      // Number(e.target.value) || 0 -> Number(e.target.value) ?? 0
      {
        regex: /(Number\([^)]+\))\s*\|\|\s*(0|null)/g,
        replacement: '$1 ?? $2'
      },
      // +e.target.value || 0 -> +e.target.value ?? 0
      {
        regex: /(\+e\.target\.value)\s*\|\|\s*(0|null)/g,
        replacement: '$1 ?? $2'
      }
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        line = line.replace(pattern.regex, pattern.replacement);
      }
    }

    // Also handle cases where the default is a non-zero number
    // parseFloat(e.target.value) || 1 -> parseFloat(e.target.value) ?? 1
    const genericPatterns = [
      {
        regex: /(parseFloat\([^)]+\))\s*\|\|\s*([0-9]+(?:\.[0-9]+)?)/g,
        replacement: '$1 ?? $2'
      },
      {
        regex: /(parseInt\([^)]+\))\s*\|\|\s*([0-9]+)/g,
        replacement: '$1 ?? $2'
      },
      {
        regex: /(Number\([^)]+\))\s*\|\|\s*([0-9]+(?:\.[0-9]+)?)/g,
        replacement: '$1 ?? $2'
      }
    ];

    for (const pattern of genericPatterns) {
      if (pattern.regex.test(line)) {
        line = line.replace(pattern.regex, pattern.replacement);
      }
    }

    if (line !== originalLine) {
      modified = true;
      fixCount++;
      console.log(`${colors.cyan}  Line ${i + 1}: Fixed onChange handler${colors.reset}`);
      console.log(`${colors.magenta}    Before: ${originalLine.trim()}${colors.reset}`);
      console.log(`${colors.green}    After:  ${line.trim()}${colors.reset}`);
    }

    modifiedLines.push(line);
  }

  if (modified) {
    fs.writeFileSync(filePath, modifiedLines.join('\n'));
  }

  return { modified, fixCount };
}

function processFiles() {
  console.log(`${colors.bright}${colors.blue}Searching for TypeScript/React files with onChange handlers to fix...${colors.reset}\n`);

  // Find all .tsx and .jsx files
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

    // Check if file has any of the problematic patterns
    const hasProblematicPattern =
      /parseFloat\([^)]+\)\s*\|\|/.test(fileContent) ||
      /parseInt\([^)]+\)\s*\|\|/.test(fileContent) ||
      /Number\([^)]+\)\s*\|\|/.test(fileContent) ||
      /\+e\.target\.value\s*\|\|/.test(fileContent);

    if (!hasProblematicPattern) {
      continue;
    }

    console.log(`${colors.yellow}Checking: ${file}${colors.reset}`);
    const result = findAndFixOnChangeHandlers(file);

    if (result.modified) {
      totalFixed += result.fixCount;
      filesModified++;
      modifiedFiles.push(file);
      console.log(`${colors.green}  ✓ Fixed ${result.fixCount} issue(s)${colors.reset}\n`);
    } else {
      console.log(`  No changes needed\n`);
    }
  }

  // Print summary
  console.log(`${colors.bright}${colors.green}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`${colors.green}✓ Fixed ${totalFixed} onChange handler(s) in ${filesModified} file(s)${colors.reset}\n`);

  if (modifiedFiles.length > 0) {
    console.log(`${colors.bright}Modified files:${colors.reset}`);
    modifiedFiles.forEach(file => {
      console.log(`  ${colors.cyan}• ${file}${colors.reset}`);
    });
  }

  console.log(`\n${colors.bright}${colors.yellow}Note: onChange handlers will now correctly handle 0 as a valid value${colors.reset}`);
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