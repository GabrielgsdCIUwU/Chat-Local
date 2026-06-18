import path from "node:path";
import { fileURLToPath } from "node:url";
import { CommandLoader } from "../../backend/core/CommandLoader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const subcommandsPath = path.join(__dirname, "./eco");

export const description = "Módulo principal de economía. Usa subcomandos para gestionar tu dinero.";

/**
 * @param {import('../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    if (!context.subcommands || context.subcommands.length === 0) {
        return context.reply("Debes especificar un subcomando.");
    }

    const subcommandName = context.subcommands[0];
    const subcommandLoaded = await CommandLoader.load(subcommandsPath, subcommandName);

    if (!subcommandLoaded?.execute) {
        return context.reply(`El comando "/eco ${subcommandName}" no existe.`);
    }

    try {
        await subcommandLoaded.execute(context);
    } catch (err) {
        console.error(`Error executing eco subcommand ${subcommandName}:`, err);
        context.reply("Hubo un error al ejecutar el comando.");
    }
}