export const params = [
    {name: "recipe_id", type: "string", required: true}
];

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */

export async function execute(context) {
    const recipeId = context.args[0].trim();

    const craftedItem = await context.container.craftingService.craftItem(context.username, recipeId);

    context.reply(`✨ **CRAFTEO HECHO!**\n**${context.username}** has creado **${craftedItem.name}**.\nEl efecto mágico está ahora activo! usa \`/rpg buffs\` para comprobar tus efectos activos.`);
}