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
        console.log(error);
        return null;
    }
}

export async function handleCommand({ cmd, socket, io, username }) {
    const { command, subcommands, params, raw } = cmd;

    console.log("c",command, "s", subcommands, "p", params,"r", raw)

    const commandModule = await loadCommand(command);

    if (commandModule && commandModule.execute) {
        commandModule.execute({
            subcommand: subcommands,
            args: params,
            socket,
            io,
            username,
            raw
        });
    } else {
        io.emit("sendmsg", { user: "🤖 Bot", message: "No existe este comando, revisa lo que has escrito: " + raw,  timestamp: new Date().getTime() });
    }
}

export default { handleCommand };