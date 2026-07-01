import { RPG_CONFIG } from '../../../backend/core/rpgConfig.js';
import { EmbedMessage } from '../../utility/EmbedMessage.js';
import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to list available jobs.
 * @extends BaseCommand
 */
class JobCommand extends BaseCommand {
    constructor() {
        super({
            name: "job",
            description: "Muestra la lista de oficios disponibles para elegir."
        });
    }

    /**
     * 
     * @param {BotContext} context 
     */
    async run(context) {
        const embed = new EmbedMessage();

        for (const [key, job] of Object.entries(RPG_CONFIG.JOBS)) {
            embed.addField(`${job.emoji} ${job.name}`, `Usa: \`/rpg join ${key}\``);
        }

        context.reply(`📜 **Oficios Disponibles**\n${embed.toString()}`);
    }
}
export default new JobCommand();