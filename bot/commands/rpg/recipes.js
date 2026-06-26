import { RPG_CONFIG } from "../../../backend/core/rpgConfig.js";
import { EmbedMessage } from "../../utility/EmbedMessage.js";
import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to craft potions and magical items.
 * @extends BaseCommand
 */
class RecipesCommand extends BaseCommand {
    constructor() {
        super({
            name: "recipes",
            description: "Muestra todas las recetas de crafteo disponibles y su coste de materiales."
        });
    }

    /**
     * 
     * @param {BotContext} context 
     */
    async run(context) {
        const embed = new EmbedMessage();

        for (const [key, recipe] of Object.entries(RPG_CONFIG.CRAFTING_RECIPES)) {
            const cost = Object.entries(recipe.cost)
                .map(([item, quantity]) => `${quantity}x ${item}`)
                .join(", ");

            embed.addField(`🧪 ${recipe.name} \`(${key})\``, `*${recipe.description}*\n**Precio:** ${cost}`);
        }

        context.reply(`📜 **Recetas de crafteo**\n*(Usa \`/rpg craft [id]\` para hacer una poción)*\n${embed.toString()}`);
    }
}
export default new RecipesCommand();