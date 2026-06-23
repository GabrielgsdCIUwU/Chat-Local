import { RPG_CONFIG } from '../../../backend/core/rpgConfig.js';

export const description = "Únete a un oficio para poder empezar a trabajar.";

const availableJobs = Object.keys(RPG_CONFIG.JOBS);
export const params = [
    { name: "oficio", type: "string", required: true, values: availableJobs, description: "Elige entre minero, leñador o pescador." }
];

/**
 * 
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const jobKey = context.args[0];

    const jobName = await context.container.rpgService.joinJob(context.username, jobKey);
    context.reply(`🎉 ¡Felicidades! **${context.username}** ahora es un **${jobName}**. ¡Usa \`/rpg work\`!`);
}