import { GAME_CONFIG } from "../../../backend/core/constants.js";
import { BaseCommand } from "../../core/BaseCommand.js";

/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */

/**
 * Command to declare bankruptcy when the user has no money.
 * @extends BaseCommand
 */
class BancaRotaCommand extends BaseCommand {
    constructor() {
        super({
            name: "bancaRota",
            description: "Declárate en bancarrota si te quedaste sin dinero (añade deuda)."
        });
    }

    /**
     * 
     * @param {BotContext} context 
     */
    async run(context) {
        const eco = context.container.economyService;
        let currentBankRupt = 0;

        await context.container.gamblingRepository.executeTransaction(async (users) => {
            const gambler = context.container.gamblingRepository.ensureUser(users, context.username);
            gambler.bankRupt = (gambler.bankRupt || 0) + 1;
            currentBankRupt = gambler.bankRupt;
        });

        await eco.declareBankruptcy(context.username, currentBankRupt);

        context.reply(`🏦 **${context.username}** acaba de llamar al banco y ha vuelto a tener **${GAME_CONFIG.BANKRUPT_BASE_MONEY}€**. Ha llamado a la banca un total de ${currentBankRupt} veces.`);
    }

    /**
     * @param {BotContext} context
     * @param {Record<string, any>} args
     * @param {Error} error
     */
    async rollback(context, args, error) {
        await context.container.gamblingRepository.executeTransaction(async (users) => {
            const gambler = context.container.gamblingRepository.ensureUser(users, context.username);
            if (gambler.bankRupt > 0) {
                gambler.bankRupt -= 1;
            }
        });
    }
}

export default new BancaRotaCommand();