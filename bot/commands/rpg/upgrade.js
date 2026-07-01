import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to upgrade the current tool.
 * @extends BaseCommand
 */
class UpgradeCommand extends BaseCommand {
    constructor() {
        super({
            name: "upgrade",
            description: "Mejora tu herramienta al siguiente nivel gastando dinero y materiales."
        });
    }

    async run(context) {
        const newToolName = await context.container.rpgService.upgradeTool(context.username);

        context.reply(`⬆️ ¡ÉXITO! **${context.username}** ha mejorado su equipo. Ahora usa: **${newToolName}**.`);
    }
}
export default new UpgradeCommand();