import { GAME_CONFIG } from "../../../backend/core/constants.js";

export const description = "Declárate en bancarrota si te quedaste sin dinero (añade deuda).";

/**
 * @param {import("./types/CommandContext.js").GamblingContext} context 
 */
export async function execute(context) {
    const gamblerBankRupt = context.currentUser;
    const eco = context.container.economyService;

    try {
        gamblerBankRupt.bankRupt = (gamblerBankRupt.bankRupt || 0) + 1;
        await eco.declareBankruptcy(context.username, gamblerBankRupt.bankRupt);

        context.reply(`🏦 ${context.username} acaba de llamar al banco y ha vuelto a tener ${GAME_CONFIG.BANKRUPT_BASE_MONEY}€. Ha llamado a la banca un total de ${gamblerBankRupt.bankRupt} veces.`);
    } catch (error) {
        gamblerBankRupt.bankRupt -= 1;
        context.reply(`❌ ${context.username}, ${error.message}`);
    }
    
    
}