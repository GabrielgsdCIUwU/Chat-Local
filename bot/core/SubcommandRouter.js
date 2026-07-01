import { CommandLoader } from "../../backend/core/CommandLoader.js";

export class SubcommandRouter {
    /**
     * Dynamic reroute a subcommand execution.
     * @param {import('./BotContext.js').BotContext} context 
     * @param {string} subcommandsPath - Absolute path.
     * @param {string} moduleName - Name of the base command.
     */
    static async route(context, subcommandsPath, moduleName) {
        if (!context.subcommands || context.subcommands.length === 0) {
            return context.reply(`Debes especificar un subcomando para \`/${moduleName}\`.`);
        }

        const subcommandName = context.subcommands[0];
        const moduleLoaded = await CommandLoader.load(subcommandsPath, subcommandName);

        const commandInstance = moduleLoaded?.default || moduleLoaded;

        if (!commandInstance || typeof commandInstance.execute !== 'function') {
            return context.reply(`El subcomando "/${moduleName} ${subcommandName}" no existe.`);
        }

        await commandInstance.execute(context);
    }
}