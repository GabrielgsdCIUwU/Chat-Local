export function execute({ args, socket, io, username, currenData, userIndex, actualEarningsPayingDebt }) {
    const timestamp = new Date().getTime();

    const baseAmount = 250;
    const twelveHours = 12 * 60 * 60 * 1000;
    const oneDayAndHalf = 36 * 60 * 60 * 1000;

    const user = currenData[userIndex];

    if (!user.lastDaily) user.lastDaily = 0;
    if (!user.dailyStreak) user.dailyStreak = 0;

    const timeSinceLastDaily = timestamp - user.lastDaily;
    const now = new Date(timestamp);
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;

    if (!isWeekday) {
        io.emit("sendmsg", {
            user: "🤖 Bot",
            message: `${username}, solo puedes reclamar el daily de lunes a viernes.`,
            timestamp
        });
        return;
    }

    if (timeSinceLastDaily < twelveHours) {
        const timeLeft = twelveHours - timeSinceLastDaily;
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

        io.emit("sendmsg", {
            user: "🤖 Bot",
            message: `${username}, ya has reclamado tu recompensa diaria. Tiempo restante: ${hours} horas, ${minutes} minutos, ${seconds} segundos.`,
            timestamp
        });
        return;
    }

    if (timeSinceLastDaily > oneDayAndHalf) {
        user.dailyStreak = 1;
    } else {
        user.dailyStreak += 1;
    }

    const randomBonusFactor = Math.floor(Math.random() * (100 - 25 + 1)) + 25;
    const streakBonus = user.dailyStreak * randomBonusFactor;
    const totalReward = baseAmount + streakBonus;

    user.money += actualEarningsPayingDebt(totalReward, currenData[userIndex]);
    user.totalEarnings += totalReward;
    user.lastDaily = timestamp;

    const message =
        user.dailyStreak === 1
            ? `${username} ha reclamado su daily. Tu racha ha comenzado de nuevo. Bonus: +${streakBonus}€. Total recibido: ${totalReward}€`
            : `${username} ha reclamado su daily. Racha actual: ${user.dailyStreak} días. Bonus: +${streakBonus}€. Total recibido: ${totalReward}€`;

    io.emit("sendmsg", { user: "🤖 Bot", message, timestamp });
}
