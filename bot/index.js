import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta donde se almacenan los comandos del bot
const commandsPath = path.join(__dirname, "./commands");

// Función para cargar y ejecutar un comando
async function loadCommand(commandName) {
    try {
        const commandPath = pathToFileURL(path.join(commandsPath, `${commandName}.js`)).href;
        return await import(commandPath);
    } catch (error) {
        console.error(`Error al cargar el comando ${commandName}:`, error);
        return null;
    }
}

export async function handleCommand({ msg, socket, io, username }) {
    const args = msg.split(" ").slice(1); // Obtener argumentos del comando
    const commandName = args[0]; // Nombre del comando
    const command = await loadCommand(commandName);

    if (command && command.execute) {
        command.execute({ args: args.slice(1), socket, io, username, msg }); // Ejecutar lógica del comando
    } else {
        socket.emit("error", { message: "Comando no encontrado" });
    }
}

export default { handleCommand };