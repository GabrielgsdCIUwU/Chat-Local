export const description = "Rechaza una invitación a un gremio.";

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    await context.container.guildService.resolveInvite(context.username, false);
    context.reply(`❌ **${context.username}** ha rechazado la invitación al gremio.`);
}