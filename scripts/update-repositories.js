#!/usr/bin/env node

/**
 * Script to update all repository instantiations to use Repository Manager
 * This will help us batch update all files consistently
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to replace
const replacements = [
  {
    pattern: /import\s+{\s*(\w+Repository)\s*}\s+from\s+['"]@\/lib\/repositories\/[\w-]+\.repository['"]/g,
    getImport: (repoName) => {
      // Map repository names to their helper functions
      const repoMap = {
        'RepairTicketRepository': 'tickets',
        'CustomerRepository': 'customers',
        'UserRepository': 'users',
        'DeviceRepository': 'devices',
        'AppointmentRepository': 'appointments',
        'TicketNoteRepository': 'notes',
        'ServiceRepository': 'services',
        'CustomerDeviceRepository': 'customerDevices',
      };
      return repoMap[repoName] || null;
    }
  },
  {
    // Replace new Repository() calls
    pattern: /const\s+(\w+)\s*=\s*new\s+(\w+Repository)\(\)/g,
    replacement: (match, varName, repoClass) => {
      const repoMap = {
        'RepairTicketRepository': 'tickets',
        'CustomerRepository': 'customers',
        'UserRepository': 'users',
        'DeviceRepository': 'devices',
        'AppointmentRepository': 'appointments',
        'TicketNoteRepository': 'notes',
        'ServiceRepository': 'services',
        'CustomerDeviceRepository': 'customerDevices',
      };
      const helper = repoMap[repoClass];
      if (helper) {
        return `const ${varName} = getRepository.${helper}()`;
      }
      return match; // Don't change if not mapped
    }
  },
  {
    // Replace new Repository(true) calls with service role
    pattern: /const\s+(\w+)\s*=\s*new\s+(\w+Repository)\(true\)/g,
    replacement: (match, varName, repoClass) => {
      const repoMap = {
        'RepairTicketRepository': 'tickets',
        'CustomerRepository': 'customers',
        'UserRepository': 'users',
        'DeviceRepository': 'devices',
        'AppointmentRepository': 'appointments',
        'TicketNoteRepository': 'notes',
        'ServiceRepository': 'services',
        'CustomerDeviceRepository': 'customerDevices',
      };
      const helper = repoMap[repoClass];
      if (helper) {
        return `const ${varName} = getRepository.${helper}(true)`;
      }
      return match; // Don't change if not mapped
    }
  }
];

// Files to update
const filesToUpdate = [
  'app/api/admin/services/*.ts',
  'app/api/admin/devices/**/*.ts',
  'app/api/admin/users/**/*.ts',
  'app/api/users/**/*.ts',
  'app/api/customers/**/*.ts',
];

function updateFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let hasGetRepository = false;
  
  // Check if file already imports getRepository
  if (content.includes('getRepository')) {
    console.log(`  - Already uses getRepository, skipping...`);
    return;
  }
  
  // Track which repositories are used
  const usedRepos = new Set();
  
  // Apply replacements
  replacements.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, (match, ...args) => {
      if (replacement) {
        modified = true;
        const result = replacement(match, ...args);
        
        // Track repository usage
        if (args[1] && args[1].endsWith('Repository')) {
          usedRepos.add(args[1]);
        }
        
        return result;
      }
      return match;
    });
  });
  
  // Add getRepository import if we made changes
  if (modified && usedRepos.size > 0) {
    // Remove old repository imports
    usedRepos.forEach(repo => {
      const importPattern = new RegExp(
        `import\\s+{\\s*${repo}\\s*}\\s+from\\s+['"]@/lib/repositories/[\\w-]+\\.repository['"];?\\n?`,
        'g'
      );
      content = content.replace(importPattern, '');
    });
    
    // Add new import at the top (after next imports)
    if (!hasGetRepository) {
      const nextImportMatch = content.match(/(import\s+.*?from\s+['"]next.*?['"];?\n)/);
      if (nextImportMatch) {
        const insertPosition = nextImportMatch.index + nextImportMatch[0].length;
        content = content.slice(0, insertPosition) + 
                  "import { getRepository } from '@/lib/repositories/repository-manager';\n" +
                  content.slice(insertPosition);
      }
    }
    
    // Write back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Updated successfully`);
  } else {
    console.log(`  - No changes needed`);
  }
}

// Process all files
console.log('Starting repository update process...\n');

filesToUpdate.forEach(pattern => {
  const files = glob.sync(pattern);
  files.forEach(file => {
    const fullPath = path.resolve(file);
    if (fs.existsSync(fullPath)) {
      updateFile(fullPath);
    }
  });
});

console.log('\nUpdate process completed!');