import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to donate money to the guild's bank.
 * @extends BaseCommand
 */
class DonateGuildCommand extends BaseCommand {
    constructor() {
        super({
            name: "donate",
            description: "Dona dinero al banco de tu gremio para subirlo de nivel.",
            params: [
                { name: "cantidad", type: "number", required: true, description: "Cantidad de dinero a donar." }
            ]
        });
    }

    /**
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
        const { amount } = args;

        const result = await context.container.guildService.donate(context.username, amount);

        let msg = `💰 **DONACIÓN**\n**${context.username}** ha donado **${amount.toLocaleString('es-ES')}€** al banco de su gremio.`;
        if (result.levelUp) {
            msg += `\n🌟 **¡SUBIDA DE NIVEL!** El gremio ha alcanzado el **Nivel ${result.currentLevel}**.`;
        }
        context.reply(msg);
    }
}
export default new DonateGuildCommand();