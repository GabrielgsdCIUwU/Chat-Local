export function execute({ args, socket, io, username, currenData, userIndex, actualEarningsPayingDebt }) {
    const timestamp = new Date().getTime();
    let gamblerBankRupt = currenData[userIndex];
    if (gamblerBankRupt.money == 0) {
        gamblerBankRupt.bankRupt++;
        gamblerBankRupt.debt = gamblerBankRupt.debt + 100 + Math.floor(Math.random() * parseInt(gamblerBankRupt.bankRupt) * 10);
        gamblerBankRupt.money = 100;
        return io.emit("sendmsg", { user: "🤖 Bot", message: `${username} acaba de llamar al banco y ha vuelto a tener ${gamblerBankRupt.money}, ha llamado a la banca un total de ${gamblerBankRupt.bankRupt} veces`, timestamp });
    } else {
        return io.emit("sendmsg", { user: "🤖 Bot", message: `${username} tienes ${gamblerBankRupt.money}€, no puedes darte como banca rota`, timestamp });
    }
}