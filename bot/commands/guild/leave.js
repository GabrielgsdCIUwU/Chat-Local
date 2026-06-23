export const description = "Abandona tu gremio actual de forma permanente.";

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    await context.container.guildService.leaveGuild(context.username);
    context.reply(`🚪 **${context.username}** ha abandonado su gremio de manera definitiva.`);
}