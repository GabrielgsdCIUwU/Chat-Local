export const params = [
    { name: "guild_name", type: "string", required: true }
];

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const guildName = context.args.join(" ");

    const newGuild = await context.container.guildService.createGuild(context.username, guildName);

    context.reply(`🏰 **¡SE HA FUNDADO UN NUEVO GREMIO!**\n**${context.username}** ha invertido 50.000€ para fundar el gremio **[${newGuild.name}]**. ¡Que su legado perdure a través de las eras!`);
}