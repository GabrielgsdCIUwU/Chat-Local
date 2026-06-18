/**
 * @param {import("./types/CommandContext.js").GamblingContext} context 
 */
export async function execute(context) {
    const gamblerBankRupt = context.currentUser;
    const eco = context.container.economyService;

    try {
        gamblerBankRupt.bankRupt = (gamblerBankRupt.bankRupt || 0) + 1;
        await eco.declareBankruptcy(context.username, gamblerBankRupt.bankRupt);

        context.reply(`🏦 ${context.username} acaba de llamar al banco y ha vuelto a tener 100€. Ha llamado a la banca un total de ${gamblerBankRupt.bankRupt} veces.`);
    } catch (error) {
        gamblerBankRupt.bankRupt -= 1;
        context.reply(`❌ ${context.username}, ${error.message}`);
    }
    
    
}