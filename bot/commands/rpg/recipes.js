import { RPG_CONFIG } from "../../../backend/core/rpgConfig.js";
import { EmbedMessage } from "../../utility/EmbedMessage.js";

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */

export function execute(context) {
    const embed = new EmbedMessage();

    for (const [key, recipe] of Object.entries(RPG_CONFIG.CRAFTING_RECIPES)) {
        const cost = Object.entries(recipe.cost)
            .map(([item, quantity]) => `${quantity}x ${item}`)
            .join(", ");
        
        embed.addField(`🧪 ${recipe.name} \`(${key})\``, `*${recipe.description}*\n**Precio:** ${cost}`);
    }

    context.reply(`📜 **Recetas de crafteo**\n*(Usa \`/rpg craft [id]\` para hacer una poción)*\n${embed.toString()}`);
}