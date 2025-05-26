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

    function isBusinessDay(date) {
        const d = date.getDay();
        return d !== 0 && d !== 6;
    }

    function businessDayBetween(d1, d2) {
        let count =0;
        const date = new Date(d1);
        while (date < d2) {
            date.setDate(date.getDate() +1)
            if (isBusinessDay(date)) count++;
        }
        return count;
    }

    const diff = (now - user.lastDaily) / (1000 * 60 * 60 * 24);
    const businessDays = businessDayBetween(user.lastDaily, now);

    // Nueva lógica para mantener la racha de viernes a lunes
    let keepStreak = false;
    if (now.getDay() === 1) { // Si hoy es lunes
        const lastDailyDate = new Date(user.lastDaily);
        if (lastDailyDate.getDay() === 5) { // Y el último daily fue viernes
            // Comprobar que no han pasado más de 3 días naturales (viernes a lunes)
            const daysPassed = Math.floor((now - lastDailyDate) / (1000 * 60 * 60 * 24));
            if (daysPassed <= 3) {
                keepStreak = true;
            }
        }
    }

    if (keepStreak) {
        user.dailyStreak += 1;
    } else if (businessDays > 1 || (businessDays === 1 && diff > 1.5)) {
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
