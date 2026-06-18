import { EmbedMessage } from "../../utility/EmbedMessage.js";

export const description = "Muestra la información de tu gremio actual.";

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const guild = await context.container.guildService.getUserGuild(context.username);

    if (!guild) {
        return context.reply("No estás en una guild.");
    }

    const leader = guild.members.find(m => m.rank === "Leader");
    const members = guild.members.map(m => `• ${m.name} (${m.rank})`).join("\n");

    const embed = new EmbedMessage()
        .addField("👑 Líder", leader.name)
        .addField("⭐ Nivel", guild.level.toString())
        .addField("🏦 Saldo del Banco", `${guild.bankMoney.toLocaleString('es-ES')}€`)
        .addField(`👥 Miembros (${guild.members.length})`, membersList);

    context.reply(`🏰 **Perfil del Gremio: [${guild.name}]**\n${embed.toString()}`);

}