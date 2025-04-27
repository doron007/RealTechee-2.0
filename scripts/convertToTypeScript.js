/**
 * TypeScript Conversion Helper Script
 * 
 * This script helps automate the process of converting JavaScript files to TypeScript.
 * It does the following:
 * 1. Renames .js files to .tsx or .ts
 * 2. Adds TypeScript interfaces using the type definitions
 * 3. Adds proper typing to component props and state
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const rename = promisify(fs.rename);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const COMPONENTS_DIR = path.resolve(ROOT_DIR, 'components');
const PAGES_DIR = path.resolve(ROOT_DIR, 'pages');
const TYPES_DIR = path.resolve(ROOT_DIR, 'types');

// Helper to get all .js files recursively
async function getJsFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      const subFiles = await getJsFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.name.endsWith('.js') && !entry.name.includes('index.js')) {
      // Skip index.js files as they'll be handled separately
      files.push(fullPath);
    }
  }

  return files;
}

// Helper to determine if a file should be .tsx or .ts
function isTsx(filePath) {
  // Check if the file likely contains JSX by searching for common React imports
  // and JSX syntax like <Component>, <div>, etc.
  const content = fs.readFileSync(filePath, 'utf8');
  return (
    content.includes('import React') || 
    content.includes('from "react"') || 
    content.includes('from \'react\'') ||
    /\<[A-Za-z][A-Za-z0-9]*/.test(content) // Basic regex for JSX tags
  );
}

// Helper to convert an index.js file to TypeScript
async function convertIndexFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const dirName = path.dirname(filePath);
    const baseName = path.basename(dirName);
    const tsContent = content
      .replace(/\.js/g, '') // Remove .js extensions from imports
      .replace(/from\s+['"]\.\/([^'"]+)['"]/g, 'from \'./$1\''); // Ensure proper quote formatting
    
    await writeFile(filePath.replace('.js', '.ts'), tsContent);
    console.log(`✓ Converted index file: ${filePath} -> ${filePath.replace('.js', '.ts')}`);
  } catch (error) {
    console.error(`Error converting index file ${filePath}:`, error);
  }
}

// Helper to convert a component file to TypeScript
async function convertComponentFile(filePath) {
  try {
    // Read the file content
    const content = await readFile(filePath, 'utf8');
    
    // Determine if it should be .tsx or .ts
    const isTsxFile = isTsx(filePath);
    const newExt = isTsxFile ? '.tsx' : '.ts';
    const newFilePath = filePath.replace('.js', newExt);
    
    // Find the component name based on the export default function
    const componentNameMatch = content.match(/export\s+default\s+function\s+(\w+)/);
    const componentName = componentNameMatch ? componentNameMatch[1] : path.basename(filePath, '.js');

    // Determine which type definition to import based on the file location and component name
    let typeImport = '';
    let propsType = 'any';
    
    // Try to figure out which type to use based on component directory and name
    if (filePath.includes('/components/common/buttons/')) {
      typeImport = `import { ButtonProps } from '@types/components/common/buttons';`;
      propsType = 'ButtonProps';
    } else if (filePath.includes('/components/common/layout/')) {
      if (componentName === 'Layout') {
        typeImport = `import { LayoutProps } from '@types/components/common/layout';`;
        propsType = 'LayoutProps';
      } else if (componentName === 'Header') {
        typeImport = `import { HeaderProps } from '@types/components/common/layout';`;
        propsType = 'HeaderProps';
      } else if (componentName === 'Footer') {
        typeImport = `import { FooterProps } from '@types/components/common/layout';`;
        propsType = 'FooterProps';
      }
    } else if (filePath.includes('/components/common/ui/')) {
      if (componentName === 'ColorTile') {
        typeImport = `import { ColorTileProps } from '@types/components/common/ui';`;
        propsType = 'ColorTileProps';
      } else if (componentName === 'StatItem') {
        typeImport = `import { StatItemProps } from '@types/components/common/ui';`;
        propsType = 'StatItemProps';
      }
    } else if (filePath.includes('/components/home/')) {
      if (componentName === 'Hero') {
        typeImport = `import { HeroProps } from '@types/components/home';`;
        propsType = 'HeroProps';
      } else if (componentName === 'Features') {
        typeImport = `import { FeaturesProps } from '@types/components/home';`;
        propsType = 'FeaturesProps';
      } else if (componentName === 'Testimonials') {
        typeImport = `import { TestimonialsProps } from '@types/components/home';`;
        propsType = 'TestimonialsProps';
      } else if (componentName === 'Stats' || componentName === 'StatsSection') {
        typeImport = `import { StatsProps } from '@types/components/home';`;
        propsType = 'StatsProps';
      } else if (componentName === 'CtaSection') {
        typeImport = `import { CtaSectionProps } from '@types/components/home';`;
        propsType = 'CtaSectionProps';
      }
    }
    
    // Create TypeScript content
    let tsContent = content;
    
    // Add type import if one was determined
    if (typeImport) {
      // Check if there are existing imports to add after
      if (tsContent.includes('import ')) {
        const lastImportIndex = tsContent.lastIndexOf('import ');
        const endOfImportsIndex = tsContent.indexOf('\n', tsContent.indexOf(';', lastImportIndex));
        tsContent = tsContent.slice(0, endOfImportsIndex + 1) + 
                   typeImport + '\n' + 
                   tsContent.slice(endOfImportsIndex + 1);
      } else {
        // No imports, add at top
        tsContent = typeImport + '\n\n' + tsContent;
      }
    }
    
    // Add type annotation to function component
    tsContent = tsContent.replace(
      new RegExp(`export\\s+default\\s+function\\s+${componentName}\\s*\\(\\s*(?:props)?\\s*\\)`, 'g'),
      `export default function ${componentName}(props: ${propsType})`
    );
    
    // Add type annotations to useState hooks
    tsContent = tsContent.replace(
      /const\s+\[(\w+),\s*set(\w+)\]\s*=\s*useState\(\s*([^)]*)\s*\)/g,
      (match, stateName, setterName, initialValue) => {
        // Try to infer the type from the initial value
        let typeAnnotation = 'any';
        if (initialValue === 'false' || initialValue === 'true') {
          typeAnnotation = 'boolean';
        } else if (initialValue === '""' || initialValue === "''") {
          typeAnnotation = 'string';
        } else if (!isNaN(Number(initialValue))) {
          typeAnnotation = 'number';
        } else if (initialValue === '[]') {
          typeAnnotation = 'any[]';
        } else if (initialValue === '{}') {
          typeAnnotation = 'Record<string, any>';
        }
        
        return `const [${stateName}, set${setterName}] = useState<${typeAnnotation}>(${initialValue})`;
      }
    );
    
    // Write the converted file
    await writeFile(newFilePath, tsContent);
    console.log(`✓ Converted component: ${filePath} -> ${newFilePath}`);
    
    // Delete the original file after successful conversion
    // fs.unlinkSync(filePath); // Uncomment to delete the original file
    
    return { oldPath: filePath, newPath: newFilePath };
  } catch (error) {
    console.error(`Error converting file ${filePath}:`, error);
    return null;
  }
}

// Main conversion function
async function convertToTypeScript() {
  console.log('🔍 Scanning for JavaScript files to convert...');
  
  try {
    // Get all JS files in components directory
    const componentFiles = await getJsFiles(COMPONENTS_DIR);
    console.log(`Found ${componentFiles.length} component files`);
    
    // Get all JS files in pages directory
    const pageFiles = await getJsFiles(PAGES_DIR);
    console.log(`Found ${pageFiles.length} page files`);
    
    // Convert component files
    console.log('\n📝 Converting component files...');
    for (const file of componentFiles) {
      await convertComponentFile(file);
    }
    
    // Convert page files
    console.log('\n📝 Converting page files...');
    for (const file of pageFiles) {
      await convertComponentFile(file);
    }
    
    // Handle index.js files separately
    console.log('\n📝 Converting index files...');
    // Find all index.js files
    const findIndexFiles = async (dir) => {
      const allFiles = [];
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await findIndexFiles(fullPath);
          allFiles.push(...subFiles);
        } else if (entry.name === 'index.js') {
          allFiles.push(fullPath);
        }
      }
      
      return allFiles;
    };
    
    const indexFiles = await findIndexFiles(COMPONENTS_DIR);
    console.log(`Found ${indexFiles.length} index files`);
    
    for (const file of indexFiles) {
      await convertIndexFile(file);
    }
    
    console.log('\n✅ TypeScript conversion completed successfully!');
  } catch (error) {
    console.error('Error during conversion:', error);
  }
}

// Run the conversion
convertToTypeScript();