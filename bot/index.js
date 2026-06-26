import { fileURLToPath} from 'node:url';
import path from 'node:path';
import { CommandLoader } from '../backend/core/CommandLoader.js';
import { BotContext } from './core/BotContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta donde se almacenan los comandos del bot
const commandsPath = path.join(__dirname, "./commands");


export async function handleCommand({ cmd, socket, io, username, container }) {
    const { command, subcommands, params: args, raw } = cmd;
    const timestamp = Date.now();

    const commandModule = await CommandLoader.load(commandsPath, command);
    
    const context = new BotContext({
            command, subcommands, args, raw, io, socket, username, container, timestamp
        });
    
    const commandInstance = commandModule?.default || commandModule;

    if (commandInstance?.execute && typeof commandInstance.execute === "function") {
        await commandInstance.execute(context);
    } else {
        context.reply("No existe este comando, revisa lo que has escrito: " + raw)
    }
}

export default { handleCommand };