const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const uploadsDir = path.join(__dirname, 'uploads/documentos');
if (fs.existsSync(uploadsDir)) {
    console.log('--- Archivos en uploads/documentos ---');
    walkDir(uploadsDir, (filePath) => {
        console.log(path.relative(uploadsDir, filePath));
    });
} else {
    console.log('La carpeta uploads/documentos no existe.');
}
