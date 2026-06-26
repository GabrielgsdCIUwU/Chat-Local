import { GAME_CONFIG } from "../../../backend/core/constants.js";
import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to attempt stealing from another user
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
     * 
     * @param {BotContext} context 
     * @param {Record<string, any>} args 
     */
    async run(context, args) {
        const { amount, targetUser } = args;
        const eco = context.container.economyService;
        const now = Date.now();

        if (context.username === targetUser) throw new Error("No puedes robarte a ti mismo.");

        const users = await context.container.gamblingRepository.getAll();
        const thiefProfile = users.find(u => u.name === context.username);

        if (thiefProfile?.lastRobbery) {
            const timePassed = now - thiefProfile.lastRobbery;
            if (timePassed < GAME_CONFIG.ROB_CONFIG.COOLDOWN_MS) {
                throw new Error(this.#getCooldownMessage(GAME_CONFIG.ROB_CONFIG.COOLDOWN_MS - timePassed));
            }
        }

        const maxPossibleFine = this.#calculatePenalty(amount);
        const thiefWallet = await eco.getBalance(context.username);

        if (thiefWallet.money < maxPossibleFine) {
            throw new Error(`Para intentar robar **${amount}€**, necesitas tener al menos **${maxPossibleFine}€** en tu cuenta para cubrir la fianza en caso de que la policía te atrape.`);
        }

        const victimWallet = await eco.getBalance(targetUser);
        if (victimWallet.money < amount) throw new Error(`La víctima solo tiene **${victimWallet.money}€**.`);

        const percentageStolen = amount / victimWallet.money;
        const { MAX_CHANCE, CHANCE_SCALING } = GAME_CONFIG.ROB_CONFIG;
        const successChance = MAX_CHANCE - (percentageStolen * CHANCE_SCALING);

        const wardConsumed = await context.container.craftingService.consumeBuff(targetUser, "anti_rob");
        let finalMessage = "";

        if (wardConsumed) {
            const penaltyLost = await eco.forceRemoveFunds(context.username, this.#calculatePenalty(amount));
            await this.#updateStats(context.container, context.username, now, 0, penaltyLost);
            finalMessage = `🛡️ **¡THIEF WARD ACTIVADO!**\n¡**${targetUser}** estaba protegido por una poderosa barrera mágica! La protección se rompió al bloquear el robo y **${context.username}** fue repelido violentamente, pagando una multa de **${penaltyLost}€**.`;

        } else if (Math.random() < successChance) {
            const { totalEarned, petMsg } = await context.container.gamblingService.processRobberyWin(context.username, targetUser, amount);
            await this.#updateStats(context.container, context.username, now, totalEarned, 0);
            finalMessage = this.#getSuccessMessage(context.username, targetUser, amount, percentageStolen, petMsg);

        } else {
            const penaltyLost = await eco.forceRemoveFunds(context.username, this.#calculatePenalty(amount));
            await this.#updateStats(context.container, context.username, now, 0, penaltyLost);
            finalMessage = this.#getFailureMessage(context.username, targetUser, penaltyLost, percentageStolen);
        }

        context.reply(finalMessage);
    }



    #calculatePenalty(amount) {
        return amount + Math.floor(amount / GAME_CONFIG.ROB_CONFIG.PENALTY_DIVISOR);
    }

    #getCooldownMessage(timeLeftMs) {
        const minutes = Math.floor(timeLeftMs / 60000);
        const seconds = Math.floor((timeLeftMs % 60000) / 1000);
        return `🚨 **Buscado por la policía:** Debes permanecer escondido durante **${minutes}m y ${seconds}s** antes de intentar robar de nuevo.`;
    }

    #getSuccessMessage(thief, victim, amount, percentage, petMsg) {
        const { STEALTH, HEIST } = GAME_CONFIG.ROB_CONFIG.THRESHOLDS;
        if (percentage <= STEALTH) return `👻 **Como un fantasma:** ${thief} le robó **${amount}€** a ${victim} y ni se dio cuenta${petMsg}.`;
        if (percentage >= HEIST) return `👑 **¡EL GOLPE DEL SIGLO!** Contra todo pronóstico, ${thief} le vació los bolsillos (**${amount}€**) a ${victim} con maestría${petMsg}.`;
        return `🕵️ ${thief} ha robado **${amount}€** a ${victim} con éxito${petMsg}.`;
    }

    #getFailureMessage(thief, victim, penalty, percentage) {
        const { CLUMSY, GREEDY } = GAME_CONFIG.ROB_CONFIG.THRESHOLDS;
        if (percentage >= GREEDY) return `🚨 **Demasiado avaricioso:** ${thief} intentó robar casi todo el dinero de ${victim}. Hizo tanto ruido que la policía lo atrapó al instante, pagando **${penalty}€** en multas.`;
        if (percentage <= CLUMSY) return `🤦 **Mala suerte:** ${thief} intentó robar una miseria a ${victim}, pero tropezó absurdamente y la policía lo atrapó, perdiendo **${penalty}€**.`;
        return `👮 ${thief} intentó robar a ${victim} pero la policía lo atrapó, perdiendo **${penalty}€** en multas.`;
    }

    async #updateStats(container, username, now, earned, spent) {
        await container.gamblingRepository.executeTransaction(async (users) => {
            const gambler = container.gamblingRepository.ensureUser(users, username);
            gambler.timesSteal = (gambler.timesSteal || 0) + 1;
            gambler.lastRobbery = now;
            if (earned > 0) {
                gambler.moneySteal = (gambler.moneySteal || 0) + earned;
                gambler.totalEarnings = (gambler.totalEarnings || 0) + earned;
            }
            if (spent > 0) {
                gambler.spend = (gambler.spend || 0) + spent;
            }
        });
    }
}
export default new RobarCommand();