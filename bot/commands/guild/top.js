import { BOT_CONFIG } from "../../../backend/core/constants.js";
import { EmbedMessage } from "../../utility/EmbedMessage.js";
import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to reject a pending guild invitation.
 * @extends BaseCommand
 */
class TopguildsCommand extends BaseCommand {
    constructor() {
        super({
            name: "top",
            description: "Muestra el ranking de los gremios más poderosos y ricos."
        });
    }

    /**
     * 
     * @param {BotContext} context 
     */
    async run(context) {
        const topGuilds = await context.container.guildService.getTopGuilds(BOT_CONFIG.TOP_LIMIT_DEFAULT);

        if (topGuilds.length === 0) {
            return context.reply("No hay ninguna guild actualmente.");
        }

        const embed = new EmbedMessage();

        topGuilds.forEach((g, index) => {
            embed.addField(
                `#${index + 1} [${g.name}]`,
                `⭐ Nivel: ${g.level} | 🏦 Banco: ${g.bankMoney.toLocaleString('es-ES')}€ | 👥 Miembros: ${g.members.length}`
            );
        });

        context.reply(`🏆 **Clasificación de los Gremios Más Poderosos**\n${embed.toString()}`);
    }
}
export default new TopguildsCommand();