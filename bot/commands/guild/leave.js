import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to leave the current guild.
 * @extends BaseCommand
 */
class LeaveGuildCommand extends BaseCommand {
    constructor() {
        super({
            name: "leave",
            description: "Abandona tu gremio actual de forma permanente."
        });
    }

    /**
     * 
     * @param {BotContext} context 
     */
    async run(context) {
        await context.container.guildService.leaveGuild(context.username);
        context.reply(`🚪 **${context.username}** ha abandonado su gremio de manera definitiva.`);
    }
}
export default new LeaveGuildCommand();