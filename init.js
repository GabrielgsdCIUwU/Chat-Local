import fs from 'fs';
import path from 'path';

const createFile = (filePath, content) => {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
    console.log(`Archivo creado: ${filePath}`);
  } else {
    console.log(`Archivo ya existe: ${filePath}`);
  }
};

const createFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Carpeta creada: ${folderPath}`);
  } else {
    console.log(`Carpeta ya existe: ${folderPath}`);
  }
};

createFile('./public/json/messages.json', []);
createFile('./public/json/spamer.json', []);
createFile('./backend/json/users.json', []);

createFolder('./resources/emojis');
createFolder('./resources/waitlist');

console.log('Proceso de creación de archivos y carpetas completado.');