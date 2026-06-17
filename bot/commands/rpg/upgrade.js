/**
 * 
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const newToolName = await context.container.rpgService.upgradeTool(context.username);

    context.reply(`⬆️ ¡ÉXITO! **${context.username}** ha mejorado su equipo. Ahora usa: **${newToolName}**.`);
}