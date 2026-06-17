import fs from 'node:fs';
import path from 'node:path';

const createFile = (filePath, content) => {
  if (fs.existsSync(filePath)) {
    console.log(`ℹ️ El archivo ya existe: ${filePath}`);
  } else {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
    console.log(`✅ Archivo creado: ${filePath}`);
  }
};

const createFolder = (folderPath) => {
  if (fs.existsSync(folderPath)) {
    console.log(`ℹ️ La carpeta ya existe: ${folderPath}`);
  } else {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`✅ Carpeta creada: ${folderPath}`);
  }
};

console.log('⚙️ Iniciando configuración del entorno...');

createFile('./backend/data/messages.json', []);
createFile('./backend/data/spamer.json', []);
createFile('./backend/data/users.json', []);
createFile('./backend/data/usersban.json', []);
createFile('./backend/data/gambling.json', []);
createFile('./backend/data/economy.json', []);
createFile('./public/json/encuesta.json', { "pregunta": "Ejemplo", "opciones": [], "hiden": "True" });

createFolder('./resources/emojis');
createFolder('./resources/waitlist');
createFolder('./resources/profiles');
createFolder('./sessions');

console.log('🚀 Proceso de inicialización completado con éxito.');