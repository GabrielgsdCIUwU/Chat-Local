import { BOT_CONFIG } from "../../../backend/core/constants.js";
import { EmbedMessage } from "../../utility/EmbedMessage.js";

export const description = "Muestra el ranking de los ludópatas más exitosos del casino.";

/**
 * 
 * @param {import("../../core/BotContext.js").BotContext} context 
 */
export async function execute(context) {
    const users = await context.container.gamblingRepository.db.read();

    const sorted = [...users].sort((a, b) => {
        const aEarnings = a.totalEarnings || 0;
        const bEarnings = b.totalEarnings || 0;

        if (bEarnings !== aEarnings) {
            return bEarnings - aEarnings;
        }

        const aTotal = aEarnings + (a.spend || 0);
        const bTotal = bEarnings + (b.spend || 0);
        
        const aSuccess = aTotal > 0 ? (aEarnings / aTotal) * 100 : 0;
        const bSuccess = bTotal > 0 ? (bEarnings / bTotal) * 100 : 0;

        return bSuccess - aSuccess;
    });

    const embed = new EmbedMessage();
    
    sorted.slice(0, BOT_CONFIG.TOP_LIMIT_DEFAULT).forEach((user, index) => {
        const earnings = user.totalEarnings || 0;
        const spend = user.spend || 0;
        const totalGames = earnings + spend;
        
        const success = totalGames > 0 ? ((earnings / totalGames) * 100).toFixed(2) + "%" : "0.00%";

        embed.addField(
            `#${index + 1} ${user.name}`, 
            `💶 Ganado en apuestas: ${earnings}€ | 📊 Éxito: ${success}`
        );
    });

    context.reply(`🏆 **Top Ludópatas (Ranking del Casino)**\n${embed.toString()}`);
}