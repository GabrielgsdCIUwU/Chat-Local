import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to equip or unequip a pet.
 * @extends BaseCommand
 */
class EquipCommand extends BaseCommand {
    constructor() {
        super({
            name: "equip",
            description: "Equipa una mascota usando su ID para recibir sus bonificaciones, o desequípala.",
            params: [
                { name: "petId", displayName: "ID", type: "string", required: true, description: "ID de la mascota (míralo en /pet list), o 'none' para desequipar." }
            ]
        })
    }

    /**
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
         const { petId } = args;

        const equippedPet = await context.container.petService.equipPet(context.username, petId);

        if (equippedPet === null) {
            context.reply(`📦 **${context.username}** ha guardado su mascota. Ya no tiene ninguna equipada.`);
        } else {
            context.reply(`💖 **${context.username}** ha equipado a ${equippedPet.emoji} **${equippedPet.name}**.\n*¡Sus bonificaciones mágicas ya están activas!*`);
        }
    }
}
export default new EquipCommand();