import { EmbedMessage } from "../../utility/EmbedMessage.js";

export function execute({  args, socket, io, username, currenData, userIndex, actualEarningsPayingDebt }) {
    const timestamp = new Date().getTime()

    let gambler = currenData[userIndex];
    let exito;
    if (gambler.spend != 0) {
        exito = (gambler.totalEarnings / (gambler.totalEarnings + gambler.spend)) * 100;
    } else if (gambler.totalEarnings > 0) {
        exito = 100;
    } else {
        exito = 0;
    }
    let duel;
    if (gambler.duelLose != 0) {
        duel = (gambler.duelWin / (gambler.duelWin + gambler.duelLose)) * 100;
    } else if (gambler.duelWin > 0) {
        duel = 100;
    } else {
        duel = 0;
    }

    const embed = new EmbedMessage()
        .addField("📌 Nombre", gambler.name)
        .addField("💰 Dinero actual", `${gambler.money}€`)
        .addField("💶 Total ganancias", `${gambler.totalEarnings}€`)
        .addField("💸 Gastado", `${gambler.spend}€`)
        .addField("📊 Porcentaje de éxito", `${exito.toFixed(2)}%`)
        .addField("🕵️ Robado", `${gambler.timesSteal} veces`)
        .addField("🏴‍☠️ Dinero robado: ", `${gambler.moneySteal}€`)
        .addField("🤺 Duelos ganados", gambler.duelWin)
        .addField("💀 Duelos perdidos", gambler.duelLose)
        .addField("📊 Exito de duelos", `${duel.toFixed(2)}%`)
        .addField("🏦 Banca rota", `${gambler.bankRupt} veces`)
        .addField("💳 Deuda", `${gambler.debt}€`);


    return io.emit("sendmsg", { user: "🤖 Bot", message: embed.toString(), timestamp })

}