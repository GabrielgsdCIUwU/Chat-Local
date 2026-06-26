import { RPG_CONFIG } from '../../../backend/core/rpgConfig.js';
import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to start an idle expedition.
 * @extends BaseCommand
 */
class ExpeditionCommand extends BaseCommand {
    constructor() {
        super({
            name: "expedition",
            description: "Envía a tu personaje a una expedición (Idle) para conseguir materiales pasivamente.",
            params: [
                { name: "zone", displayName: "Zona", type: "string", required: true, values: Object.keys(RPG_CONFIG.EXPEDITIONS), description: "La zona a explorar." }
            ]
        });
    }

    /**
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
        const { zone } = args;

        const config = await context.container.rpgService.startExpedition(context.username, zone);

        const totalSeconds = Math.floor(config.durationMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        let timeParts = [];
        if (hours > 0) timeParts.push(`${hours} hora(s)`);
        if (minutes > 0) timeParts.push(`${minutes} minuto(s)`);

        if (hours === 0 && minutes === 0) {
            timeParts.push(`${seconds} segundo(s)`);
        }

        const timeString = timeParts.join(" y ");

        context.reply(`🏕️ **¡VIAJE INICIADO!**\n**${context.username}** ha pagado **${config.cost}€** y se ha adentrado en **${config.name}**.\nRegresará en **${timeString}** con su botín. Se te notificará automáticamente en el chat.`);
    }
}
export default new ExpeditionCommand();