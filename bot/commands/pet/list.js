import { EmbedMessage } from "../../utility/EmbedMessage.js";
import { RPG_CONFIG } from "../../../backend/core/rpgConfig.js";

export const description = "Muestra cuántos huevos tienes sin abrir, tu mascota actual y la lista de mascotas capturadas.";

/**
 * @param {import('../../core/BotContext.js').BotContext} context 
 */
export async function execute(context) {
    const profile = await context.container.petRepository.getProfile(context.username);

    const embed = new EmbedMessage()
        .addField("🥚 Huevos sin abrir", profile.eggs.toString());

    if (profile.equipped) {
        const eqInstance = profile.pets.find(p => p.id === profile.equipped);
        const eqConfig = RPG_CONFIG.PETS[eqInstance.type];
        embed.addField("💖 Mascota Equipada", `${eqConfig.emoji} **${eqConfig.name}**`);
    } else {
        embed.addField("💖 Mascota Equipada", "Ninguna");
    }

    if (profile.pets.length === 0) {
        embed.addField("🐾 Mascotas capturadas", "Todavía no tienes ninguna.");
    } else {
        const petLines = profile.pets.map(pet => {
            const config = RPG_CONFIG.PETS[pet.type];
            const shortId = pet.id.split("-")[0]; 
            return `\`${shortId}\` | ${config.emoji} ${config.name} (${config.rarity}) -> +${config.value}%`;
        }).join("\n");

        embed.addField(`🐾 Colección (${profile.pets.length})`, petLines);
    }

    context.reply(`🏕️ **Campamento de Mascotas de ${context.username}**\n*(Para equipar usa: \`/pet equip [ID]\` usando la primera palabra del ID)*\n${embed.toString()}`);
}