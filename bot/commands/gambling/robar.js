import { GAME_CONFIG } from "../../../backend/core/constants.js";
import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to attempt stealing from another user.
 * @extends BaseCommand
 */
class RobarCommand extends BaseCommand {
    constructor() {
        super({
            name: "robar",
            description: "Intenta robar dinero a otro jugador. A mayor cantidad, más fácil que te atrapen.",
            params: [
                {name: "targetUser", displayName: "Usuario", type: "user", required: true, description: "Víctima a la que deseas robar." },
                {name: "amount", displayName: "Dinero", type: "number", required: true, description: "Cantidad que vas a intentar robar." }
            ]
        });
    }

    /**
     * Executes the robbery command logic.
     * 
     * @param {BotContext} context - Execution command context.
     * @param {Record<string, any>} args - Clean parameters parsed.
     * @returns {Promise<void>}
     */
    async run(context, args) {
        const { amount, targetUser } = args;

        const result = await context.container.gamblingService.rob(
            context.username,
            targetUser,
            amount,
            context.timestamp
        );

        const victimWallet = await context.container.economyService.getBalance(targetUser);
        const percentage = amount / (victimWallet.money + result.stolenAmount);

        let finalMessage = "";

        if (result.outcome === "ward") {
            finalMessage = `🛡️ **¡THIEF WARD ACTIVADO!**\n¡**${targetUser}** estaba protegido por una poderosa barrera mágica! La protección se rompió al bloquear el robo y **${context.username}** fue repelido violentamente, pagando una multa de **${result.penalty}€**.`;
        } else if (result.outcome === "success") {
            finalMessage = this.#getSuccessMessage(context.username, targetUser, result.totalEarned, percentage, result.petMsg);
        } else {
            finalMessage = this.#getFailureMessage(context.username, targetUser, result.penalty, percentage);
        }

        context.reply(finalMessage);
    }

    /**
     * @param {string} thief - Thief username.
     * @param {string} victim - Target username.
     * @param {number} amount - Amount stolen.
     * @param {number} percentage - Percentage.
     * @param {string} petMsg - Bonuses details.
     * @returns {string} Resulting text.
     */
    #getSuccessMessage(thief, victim, amount, percentage, petMsg) {
        const { STEALTH, HEIST } = GAME_CONFIG.ROB_CONFIG.THRESHOLDS;
        if (percentage <= STEALTH) return `👻 **Como un fantasma:** ${thief} le robó **${amount}€** a ${victim} y ni se dio cuenta${petMsg}.`;
        if (percentage >= HEIST) return `👑 **¡EL GOLPE DEL SIGLO!** Contra todo pronóstico, ${thief} le vació los bolsillos (**${amount}€**) a ${victim} con maestría${petMsg}.`;
        return `🕵️ ${thief} ha robado **${amount}€** a ${victim} con éxito${petMsg}.`;
    }

    /**
     * @param {string} thief - Thief username.
     * @param {string} victim - Target username.
     * @param {number} penalty - Penalty amount.
     * @param {number} percentage - Percentage.
     * @returns {string} Resulting text.
     */
    #getFailureMessage(thief, victim, penalty, percentage) {
        const { CLUMSY, GREEDY } = GAME_CONFIG.ROB_CONFIG.THRESHOLDS;
        if (percentage >= GREEDY) return `🚨 **Demasiado avaricioso:** ${thief} intentó robar casi todo el dinero de ${victim}. Hizo tanto ruido que la policía lo atrapó al instante, pagando **${penalty}€** en multas.`;
        if (percentage <= CLUMSY) return `🤦 **Mala suerte:** ${thief} intentó robar una miseria a ${victim}, pero tropezó absurdamente y la policía lo atrapó, perdiendo **${penalty}€**.`;
        return `👮 ${thief} intentó robar a ${victim} pero la policía lo atrapó, perdiendo **${penalty}€** en multas.`;
    }
}

export default new RobarCommand();