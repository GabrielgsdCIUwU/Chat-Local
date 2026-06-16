/**
 * @param {import("./types/CommandContext.js").GamblingContext} context 
 */
export function execute(context) {
    const gamblerBankRupt = context.currentUser;
    if (gamblerBankRupt.money === 0) {
        gamblerBankRupt.bankRupt = (gamblerBankRupt.bankRupt || 0) + 1;
        gamblerBankRupt.debt = (gamblerBankRupt.debt || 0) + 100 + Math.floor(Math.random() * Number.parseInt(gamblerBankRupt.bankRupt) * 10);
        gamblerBankRupt.money = 100;
        return context.reply(`${context.username} acaba de llamar al banco y ha vuelto a tener ${gamblerBankRupt.money}, ha llamado a la banca un total de ${gamblerBankRupt.bankRupt} veces`)
    } else {
        return context.reply(`${username} tienes ${gamblerBankRupt.money}€, no puedes darte como banca rota`)
    }
}