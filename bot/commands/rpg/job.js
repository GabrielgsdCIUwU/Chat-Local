import { RPG_CONFIG } from '../../../backend/core/rpgConfig.js';
import { EmbedMessage } from '../../utility/EmbedMessage.js';

/**
 * 
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export function execute(context) {
    const embed = new EmbedMessage();

    for (const [key, job] of Object.entries(RPG_CONFIG.JOBS)) {
        embed.addField(`${job.emoji} ${job.name}`, `Usa: \`/rpg join ${key}\``);
    }

    context.reply(`📜 **Oficios Disponibles**\n${embed.toString()}`);
}