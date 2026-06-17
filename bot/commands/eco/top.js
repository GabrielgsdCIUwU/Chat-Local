import { EmbedMessage } from "../../utility/EmbedMessage.js";

/**
 * 
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    try {
        const topWallets = await context.container.economyService.getTopRicher(10);

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