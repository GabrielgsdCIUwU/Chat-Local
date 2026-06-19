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
        const subcommandLoaded = await CommandLoader.load(subcommandsPath, subcommandName);

        if (!subcommandLoaded?.execute) {
            return context.reply(`El subcomando "/${moduleName} ${subcommandName}" no existe.`);
        }

        try {
            await subcommandLoaded.execute(context);
        } catch (error) {
            console.error(`[Error Command] /${moduleName} ${subcommandName}:`, error);
            context.reply(`❌ ${context.username}, ${error.message}`);
        }
    }
}