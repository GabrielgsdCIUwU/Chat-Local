import { GAME_CONFIG } from "../../../backend/core/constants.js";

export const description = "Declárate en bancarrota si te quedaste sin dinero (añade deuda).";

/**
 * 
 * @param {import("../../core/BotContext.js").BotContext} context 
 */
export async function execute(context) {
    const eco = context.container.economyService;

    try {
        let currentBankRupt = 0;
        
        await context.container.gamblingRepository.executeTransaction(async (users) => {
            const gambler = context.container.gamblingRepository.ensureUser(users, context.username);
            gambler.bankRupt = (gambler.bankRupt || 0) + 1;
            currentBankRupt = gambler.bankRupt;
        });

        await eco.declareBankruptcy(context.username, currentBankRupt);

        context.reply(`🏦 ${context.username} acaba de llamar al banco y ha vuelto a tener ${GAME_CONFIG.BANKRUPT_BASE_MONEY}€. Ha llamado a la banca un total de ${currentBankRupt} veces.`);
    } catch (error) {
        await context.container.gamblingRepository.executeTransaction(async (users) => {
            const gambler = context.container.gamblingRepository.ensureUser(users, context.username);
            if (gambler.bankRupt > 0) gambler.bankRupt -= 1;
        });
        context.reply(`❌ ${context.username}, ${error.message}`);
    }
}