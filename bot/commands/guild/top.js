import { EmbedMessage } from "../../utility/EmbedMessage.js";

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const topGuilds = await context.container.guildService.getTopGuilds(10);

    if (topGuilds.length === 0) {
        return context.reply("No hay ninguna guild actualmente.");
    }

    const embed = new EmbedMessage();

    topGuilds.forEach((g, index) => {
        embed.addField(
            `#${index + 1} [${g.name}]`,
            `⭐ Nivel: ${g.level} | 🏦 Banco: ${g.bankMoney.toLocaleString('es-ES')}€ | 👥 Miembros: ${g.members.length}`
        );
    });

    context.reply(`🏆 **Clasificación de los Gremios Más Poderosos**\n${embed.toString()}`);

}