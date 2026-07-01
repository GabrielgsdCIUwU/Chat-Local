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

        await context.container.gamblingRepository.updateTransactional(context.username, (gambler) => {
            gambler.recordBankruptcy();
            currentBankRupt = gambler.bankRupt;
        });

        await eco.declareBankruptcy(context.username, currentBankRupt);

        context.reply(`🏦 **${context.username}** acaba de llamar al banco y ha vuelto a tener **${GAME_CONFIG.ECONOMY.BANKRUPT_BASE_MONEY}€**. Ha llamado a la banca un total de ${currentBankRupt} veces.`);
    }

    /**
     * @param {BotContext} context
     * @param {Record<string, any>} args
     * @param {Error} error
     */
    async rollback(context, args, error) {
        await context.container.gamblingRepository.updateTransactional(context.username, (gambler) => {
            gambler.revertBankruptcy();
        });
    }
}

export default new BancaRotaCommand();