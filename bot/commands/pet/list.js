import { EmbedMessage } from "../../utility/EmbedMessage.js";
import { RPG_CONFIG } from "../../../backend/core/rpgConfig.js";
import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to list the user's pet collection and eggs.
 * @extends BaseCommand
 */
class ListCommand extends BaseCommand {
    constructor() {
        super({
            name: "list",
            description: "Muestra cuántos huevos tienes sin abrir, tu mascota actual y la lista de mascotas capturadas."
        });
    }

    /**
     * 
     * @param {BotContext} context 
     */
    async run(context) {
        const profile = await context.container.petRepository.getProfile(context.username);

        const embed = new EmbedMessage()
            .addField("🥚 Huevos sin abrir", profile.eggs.toString());

        if (profile.equipped) {
            const eqInstance = profile.pets.find(p => p.id === profile.equipped);
            
            if (eqInstance) {
                const eqConfig = RPG_CONFIG.PETS[eqInstance.type];
                embed.addField(
                    "💖 Mascota Equipada", 
                    `${eqConfig.emoji} **${eqConfig.name}**\n*${eqConfig.description}*`
                );
            } else {
                embed.addField("💖 Mascota Equipada", "⚠️ Mascota no encontrada (Desequípala usando /pet equip none)");
            }
        } else {
            embed.addField("💖 Mascota Equipada", "Ninguna");
        }

        if (profile.pets.length === 0) {
            embed.addField("🐾 Mascotas capturadas", "Todavía no tienes ninguna.");
        } else {
            const petLines = profile.pets.map(pet => {
                const config = RPG_CONFIG.PETS[pet.type];
                const shortId = pet.id.split("-")[0]; 
                const effectText = this.#getEffectText(config);
                
                return `\`${shortId}\` | ${config.emoji} **${config.name}** (${config.rarity})\n └ ⚡ *Efecto: ${effectText}*`;
            }).join("\n\n");

            embed.addField(`🐾 Colección (${profile.pets.length})`, petLines);
        }

        context.reply(`🏕️ **Campamento de Mascotas de ${context.username}**\n*(Para equipar usa: \`/pet equip [ID]\` usando la primera palabra del ID)*\n${embed.toString()}`);
    }
    #getEffectText(config) {
        if (config.effectType === "WORK_COOLDOWN") return `-${config.value}% tiempo de trabajo`;
        if (config.effectType === "GAMBLING_BONUS") return `+${config.value}% ganancias (Casino/Robo)`;
        if (config.effectType === "ALL_BONUS") return `-${config.value}% tiempo y +${config.value}% ganancias`;
        return `+${config.value}% bono`;
    }
}
export default new ListCommand();