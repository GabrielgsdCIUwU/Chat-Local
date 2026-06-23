export const description = "Acepta una invitación pendiente a un gremio.";

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const guildName = await context.container.guildService.resolveInvite(context.username, true);
    context.reply(`🏰 **NUEVO MIEMBRO**\n**${context.username}** ha aceptado la invitación y se ha unido al gremio **[${guildName}]**.`);
}