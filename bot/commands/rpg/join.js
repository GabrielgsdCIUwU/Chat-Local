import { RPG_CONFIG } from '../../../backend/core/rpgConfig.js';
import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to join a specific job.
 * @extends BaseCommand
 */
class JoinCommand extends BaseCommand {
    constructor() {
        super({
            name: "join",
            description: "Únete a un oficio para poder empezar a trabajar.",
            params: [
                { name: "oficio", type: "string", required: true, values: availableJobs, description: "Elige entre minero, leñador o pescador." }
            ]
        });
    }

    /**
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
        const { jobKey } = args;

        const jobName = await context.container.rpgService.joinJob(context.username, jobKey);
        context.reply(`🎉 ¡Felicidades! **${context.username}** ahora es un **${jobName}**. ¡Usa \`/rpg work\`!`);
    }
}
export default new JoinCommand();