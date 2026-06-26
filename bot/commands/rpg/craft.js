import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to craft potions and magical items.
 * @extends BaseCommand
 */
class CraftComand extends BaseCommand {
    constructor() {
        super({
            name: "craft",
            description: "Crea pociones y objetos mágicos gastando materiales de tu mochila.",
            params: [
                { name: "recipe_id", type: "string", required: true, description: "El código de la receta (ej: haste_potion)." }
            ]
        });
    }

    /**
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
        const recipeId = context.args[0].trim();

        const craftedItem = await context.container.craftingService.craftItem(context.username, recipeId);

        context.reply(`✨ **CRAFTEO HECHO!**\n**${context.username}** has creado **${craftedItem.name}**.\nEl efecto mágico está ahora activo! usa \`/rpg buffs\` para comprobar tus efectos activos.`);
    }
}
export default new CraftComand();