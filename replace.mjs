import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replaceInDir = (dir) => {
  walkDir(dir, (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let newContent = content.replace(/Bora Correr Club/g, 'Superação Assessoria');
      // replace "Bora Correr" avoiding double "Superação Assessoria Assessoria"
      newContent = newContent.replace(/Bora Correr/g, 'Superação');
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${filePath}`);
      }
    }
  });
};

replaceInDir('./src/pages');
replaceInDir('./src/components');
replaceInDir('./src/lib');
