const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const dir = 'src/app';

walkDir(dir, (filePath) => {
  if (filePath.endsWith('.tsx') && filePath !== 'src/app/layout.tsx') {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove imports
    content = content.replace(/import\s+{\s*Navbar\s*}\s+from\s+['"]@\/components\/Navbar['"];?\n?/g, '');
    content = content.replace(/import\s+{\s*Footer\s*}\s+from\s+['"]@\/components\/Footer['"];?\n?/g, '');

    // Remove tags
    content = content.replace(/<Navbar\s*\/>\s*\n?/g, '');
    content = content.replace(/<Footer\s*\/>\s*\n?/g, '');
    
    // For pages like about/page.tsx, we added `<main className="flex-1 bg-gray-50/30">`
    // but the layout now has `<main className="flex-1">`
    // Wait, let's just make the script remove `<Navbar />` and `<Footer />` and `<Navbar/>` `<Footer/>`
    content = content.replace(/<Navbar\s*\/>/g, '');
    content = content.replace(/<Footer\s*\/>/g, '');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
