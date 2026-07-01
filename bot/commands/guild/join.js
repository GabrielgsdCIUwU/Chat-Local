import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to accept a pending guild invitation.
 * @extends BaseCommand
 */
class JoinGuildCommand extends BaseCommand {
    constructor() {
        super({
            name: "join",
            description: "Acepta una invitación pendiente a un gremio."
        });
    }

    /**
     * 
     * @param {BotContext} context 
     */
    async run(context) {
        const guildName = await context.container.guildService.resolveInvite(context.username, true);
    context.reply(`🏰 **NUEVO MIEMBRO**\n**${context.username}** ha aceptado la invitación y se ha unido al gremio **[${guildName}]**.`);
    }
}
export default new JoinGuildCommand();