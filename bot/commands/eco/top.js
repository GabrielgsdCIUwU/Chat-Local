import { BOT_CONFIG } from "../../../backend/core/constants.js";
import { EmbedMessage } from "../../utility/EmbedMessage.js";

export const description = "Muestra el ranking de los jugadores más ricos del servidor.";

/**
 * 
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    try {
        const topWallets = await context.container.economyService.getTopRicher(BOT_CONFIG.TOP_LIMIT_DEFAULT);

        const embed = new EmbedMessage();
        topWallets.forEach((wallet, index) => {
            embed.addField(`#${index + 1} ${wallet.name}`, `💰 ${wallet.money}€`);
        });

        context.reply(`🏆 **Los más ricos**\n${embed.toString()}`);
    } catch (error) {
        console.error("Error al ejecutar el ranking", error);
        context.reply("❌ Error al obtener el ranking");
    }
}