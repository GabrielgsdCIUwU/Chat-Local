export const description = "Invita a un jugador a tu gremio (Solo Líder/Oficial).";
export const params = [
    { name: "usuario", type: "user", required: true, description: "Usuario al que quieres invitar." }
];

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const targetName = context.args.join(" ");
    
    if (targetName === context.username) {
        return context.reply("No puedes invitarte a ti mismo.");
    }

    const guildName = await context.container.guildService.inviteMember(context.username, targetName);

    context.reply(`🏰 **INVITACIÓN A GREMIO**\n**${context.username}** ha invitado a **${targetName}** a unirse al gremio **[${guildName}]**.\n*(Usa \`/guild join\` o \`/guild reject\`)*`);
}