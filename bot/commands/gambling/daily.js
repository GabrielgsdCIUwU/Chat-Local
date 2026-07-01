import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to claim the daily monetary reward.
 * @extends BaseCommand
 */
class DailyCommand extends BaseCommand {
    constructor() {
        super({
            name: "daily",
            description: "Reclama tu recompensa diaria de dinero. ¡Mantén la racha para ganar bonus!"
        });
    }

    /**
     * Runs the daily claim handler.
     * 
     * @param {BotContext} context - Current command bot execution context.
     * @returns {Promise<void>}
     */
    async run(context) {
        const now = new Date(context.timestamp);
        if (now.getDay() === 0 || now.getDay() === 6) {
            throw new Error(`Solo puedes reclamar el daily de lunes a viernes.`);
        }

        const result = await context.container.gamblingService.claimDaily(
            context.username,
            context.timestamp
        );

        const finalMessage = result.isNewStreak
            ? `🎁 **${context.username}** ha reclamado su daily. Tu racha ha comenzado de nuevo. Bonus de racha: +${result.streakBonus}€. Total recibido: **${result.actualEarnings}€**${result.petMsg}`
            : `🎁 **${context.username}** ha reclamado su daily. Racha actual: **${result.finalStreak} días**. Bonus de racha: +${result.streakBonus}€. Total recibido: **${result.actualEarnings}€**${result.petMsg}`;

        context.reply(finalMessage);
    }
}

export default new DailyCommand();