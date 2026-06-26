import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to reject a pending guild invitation.
 * @extends BaseCommand
 */
class RejectGuildCommand extends BaseCommand {
    constructor() {
        super({
            name: "reject",
            description: "Rechaza una invitación a un gremio."
        });
    }

    /**
     * 
     * @param {BotContext} context 
     */
    async run(context) {
        await context.container.guildService.resolveInvite(context.username, false);
        context.reply(`❌ **${context.username}** ha rechazado la invitación al gremio.`);
    }
}
export default new RejectGuildCommand();