import { RPG_CONFIG } from "../../../backend/core/rpgConfig.js";
import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to release a pet in exchange for money.
 * @extends BaseCommand
 */
class ReleaseCommand extends BaseCommand {
    constructor() {
        super({
            name: "release",
            description: `Libera a una de tus mascotas a cambio de una compensación económica del ${RPG_CONFIG.PET_REFUND_PERCENTAGE * 100}%.`,
            params: [
                { name: "petId", displayName: "ID", type: "string", required: true, description: "ID de la mascota (míralo usando /pet list)." }
            ]
        });
    }

    /**
     * 
     * @param {BotContext} context 
     */
    async run(context) {
        const { petId } = args;

        const { petConfig, refundAmount } = await context.container.petService.releasePet(context.username, petId);

        context.reply(`🌿 **¡MASCOTA LIBERADA!**\n**${context.username}** ha liberado a su ${petConfig.emoji} **${petConfig.name}** en la naturaleza.\nComo agradecimiento por cuidarla, el Gremio de Aventureros te ha compensado con **${refundAmount}€**.`);
    }
}
export default new ReleaseCommand();