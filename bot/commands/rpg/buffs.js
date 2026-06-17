import { RPG_CONFIG } from "../../../backend/core/rpgConfig.js";
import { EmbedMessage } from "../../utility/EmbedMessage.js";

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const activeBuffs = await context.container.craftingService.getActiveBuffs(context.username);

    const buffKeys = Object.keys(activeBuffs);
    if (buffKeys.length === 0) {
        return context.reply("🔮 No tienes ningún efecto mágico en este momento");
    }

    const embed = new EmbedMessage();

    for (const buffId of buffKeys) {
        const recipe = Object.values(RPG_CONFIG.CRAFTING_RECIPES).find(r => r.buffId === buffId);
        const buffName = recipe ? recipe.name : buffId;

        const msLeft = activeBuffs[buffId];
        const minutesLeft = Math.floor(msLeft / 60000);

        embed.addField(`⚡ ${buffName}`, `⏳ Expira en: ${minutesLeft} minuto(s)`);
    }

    context.reply(`🔮 **Efectos mágicos activos de ${context.username}**\n${embed.toString()}`);
}