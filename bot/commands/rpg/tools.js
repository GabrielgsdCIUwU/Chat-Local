import { RPG_CONFIG } from '../../../backend/core/rpgConfig.js';
import { EmbedMessage } from '../../utility/EmbedMessage.js';
import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to craft potions and magical items.
 * @extends BaseCommand
 */
class ToolsCommand extends BaseCommand {
    constructor() {
        super({
            name: "tools",
            description: "Muestra todas las herramientas de tu oficio actual, sus costes y botines."
        });
    }

    /**
     * 
     * @param {BotContext} context 
     */
    async run(context) {
        const profile = await context.container.jobRepository.getProfile(context.username);

        if (!profile?.job) {
            throw new Error("Aún no tienes un oficio asignado. Usa `/rpg job` para ver la lista y `/rpg join` para elegir uno.");
        }

        const jobConfig = RPG_CONFIG.JOBS[profile.job];
        const embed = new EmbedMessage();

        for (const [level, tool] of Object.entries(jobConfig.tools)) {
            const costMoney = tool.upgradeCost.money;

            const costItems = Object.entries(tool.upgradeCost.items)
                .map(([item, amount]) => `${amount}x ${item}`)
                .join(", ") || "Ninguno";

            const lootInfo = tool.lootTable
                .map(loot => `${loot.item} (${(loot.chance * 100).toFixed(0)}%)`)
                .join(" | ");

            const isCurrent = profile.toolLevel == level ? " 👈 *(Actual)*" : "";

            embed.addField(
                `Nivel ${level}: ${tool.name}${isCurrent}`,
                `**Mejora:** ${costMoney}€ | **Materiales:** ${costItems}\n**Drops:** ${lootInfo}\n`
            );
        }

        context.reply(`🛠️ **Herramientas de ${jobConfig.name}**\n*(Usa \`/rpg upgrade\` para subir al siguiente nivel)*\n${embed.toString()}`);
    }
}
export default new ToolsCommand();