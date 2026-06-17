export const params = [
    {name: "oficio", "type": "string", required: true}
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