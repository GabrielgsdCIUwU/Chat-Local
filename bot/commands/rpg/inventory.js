import { RPG_CONFIG } from '../../../backend/core/rpgConfig.js';
import { EmbedMessage } from "../../utility/EmbedMessage.js";

export const description = "Muestra tu mochila, materiales obtenidos y nivel de herramienta.";

/**
 * 
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const { profile, inventory } = await context.container.rpgService.getFullProfile(context.username);
    const wallet = await context.container.economyService.getBalance(context.username);

    if (!profile?.job) {
        return context.reply(`No tienes un oficio asignado. Usa \`/rpg job\` para ver la lista.`);
    }

    /**
     * @type {import('../../../backend/core/rpgConfig.js').JobConfig}
     */
    const jobConfig = RPG_CONFIG.JOBS[profile.job];
    const toolName = jobConfig.tools[profile.toolLevel].name;

    const embed = new EmbedMessage()
        .addField("💼 Oficio", `${jobConfig.emoji} ${jobConfig.name}`)
        .addField("🛠️ Herramienta", `Nivel ${profile.toolLevel}: ${toolName}`)
        .addField("💰 Dinero", `${wallet.money}€`);
    
    const itemsStr = Object.entries(inventory?.items || {})
        .map(([item, amount]) => `${amount}x ${item}`)
        .join("\n");

    embed.addField("🎒 Mochila", itemsStr || "Vacía");

    context.reply(`📊 **Perfil de Rol de ${context.username}**\n${embed.toString()}`);
}