import { fileURLToPath} from 'node:url';
import path from 'node:path';
import { CommandLoader } from '../backend/core/CommandLoader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta donde se almacenan los comandos del bot
const commandsPath = path.join(__dirname, "./commands");


export async function handleCommand({ cmd, socket, io, username }) {
    const { command, subcommands, params, raw } = cmd;
    const timestamp = Date.now();

    const commandModule = await CommandLoader.load(commandsPath, command);

    if (commandModule?.execute) {
        commandModule.execute({
            subcommand: subcommands,
            args: params,
            socket,
            io,
            username,
            raw
        });
    } else {
        io.emit("sendmsg", { user: "🤖 Bot", message: "No existe este comando, revisa lo que has escrito: " + raw,  timestamp });
    }
}

export default { handleCommand };