import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to prestige the character.
 * @extends BaseCommand
 */
class PrestigeCommand extends BaseCommand {
    constructor() {
        super({
            name: "prestige",
            description: "Reinicia tu progreso a cambio de un multiplicador permanente. Requiere herramienta máxima.",
            params: [
                { name: "confirmation", displayName: "Confirmación", type: "string", required: false, description: "Escribe 'confirm' si estás 100% seguro." }
            ]
        });
    }

    /**
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
        const { confirmation } = args;

        if (confirmation !== "confirm") {
        return context.reply("⚠️ **ADVERTENCIA:** Prestigiarte ELIMINARÁ todo tu dinero, restablecerá tu herramienta al nivel 1 y borrará tu inventario. A cambio, obtendrás un multiplicador de Prestigio permanente.\nPara continuar, escribe: `/rpg prestige confirm`.")
    }

    const newPrestige = await context.container.rpgService.executePrestige(context.username);

    context.reply(`🌟 **¡PRESTIGIO ALCANZADO!** 🌟\n**${context.username}** ha sacrificado su riqueza y ha alcanzado el **Nivel de Prestigio ${newPrestige}**. ¡Su nombre será recordado para siempre en las leyendas!`);
    }
}
export default new PrestigeCommand();