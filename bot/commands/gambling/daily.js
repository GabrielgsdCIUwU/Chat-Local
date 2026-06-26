import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { GAME_CONFIG } from "../../../backend/core/constants.js";
import { BaseCommand } from "../../core/BaseCommand.js";


/**
 * @typedef {import("../../core/BotContext.js").BotContext} BotContext
 */


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = resolve(__dirname, "../../../public/json/nonCountDays.json");
const data = await readFile(filePath, "utf-8");
const nonCountDays = JSON.parse(data);


/**
 * Command to claim the daily monetary reward.
 * @extends BaseCommand
 */
class DailyCommand extends BaseCommand {
    constructor() {
        super({
            name: "daily",
            description: "Reclama tu recompensa diaria de dinero. ¡Mantén la racha para ganar bonus!"
        });
    }

    async run(context) {
        const baseAmount = GAME_CONFIG.GAMBLING.DAILY.BASE_REWARD;
        const twelveHours = GAME_CONFIG.GAMBLING.DAILY.COOLDOWN_MS;
        const twentyFourHours = GAME_CONFIG.GAMBLING.DAILY.EXPIRATION_MS;
        const now = new Date(context.timestamp);

        if (!this.#isWeekday(now)) {
            throw new Error(`Solo puedes reclamar el daily de lunes a viernes.`);
        }

        let baseTotal = 0;
        let streakBonus = 0;
        let finalStreak = 0;

        await context.container.gamblingRepository.executeTransaction(async (users) => {
            const user = context.container.gamblingRepository.ensureUser(users, context.username);

            if (!user.lastDaily) user.lastDaily = 0;
            if (!user.dailyStreak) user.dailyStreak = 0;

            const timeSinceLastDaily = context.timestamp - user.lastDaily;

            if (timeSinceLastDaily < twelveHours) {
                const timeLeft = twelveHours - timeSinceLastDaily;
                const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                throw new Error(`Ya has reclamado tu recompensa diaria. Tiempo restante: ${hours}h ${minutes}m.`);
            }

            let streakBroken = false;

            if (user.lastDaily === 0) {
                user.dailyStreak = 1;
            } else {
                const lastDailyDate = new Date(user.lastDaily);

                if (this.#isBusinessDay(lastDailyDate) || this.#isNonCountDay(lastDailyDate)) {
                    const nextExpectedBusinessDay = this.#getNextBusinessDay(lastDailyDate);

                    if (now.getTime() <= nextExpectedBusinessDay.getTime() + twentyFourHours) {
                        if (now.toDateString() === nextExpectedBusinessDay.toDateString() ||
                            now.getTime() <= nextExpectedBusinessDay.getTime() + twentyFourHours) {
                            user.dailyStreak += 1;
                        } else {
                            streakBroken = true;
                        }
                    } else {
                        streakBroken = true;
                    }
                } else {
                    streakBroken = true;
                }

                if (now.getDay() === 1 && lastDailyDate.getDay() === 5) {
                    const daysSinceFriday = Math.floor((now.getTime() - lastDailyDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysSinceFriday <= 4) {
                        user.dailyStreak += 1;
                        streakBroken = false;
                    }
                }

                if (streakBroken) user.dailyStreak = 1;
            }

            user.lastDaily = context.timestamp;
            finalStreak = user.dailyStreak;

            const { BONUS_MIN, BONUS_MAX } = GAME_CONFIG.GAMBLING.DAILY;
            const randomBonusFactor = Math.floor(Math.random() * (BONUS_MAX - BONUS_MIN + 1)) + BONUS_MIN;
            streakBonus = user.dailyStreak * randomBonusFactor;
            baseTotal = baseAmount + streakBonus;
        });

        const { actualEarnings, petMsg } = await context.container.gamblingService.addRewardWithBonus(context.username, baseTotal);

        await context.container.gamblingRepository.executeTransaction(async (users) => {
            const user = context.container.gamblingRepository.ensureUser(users, context.username);
            user.totalEarnings = (user.totalEarnings || 0) + actualEarnings;
        });

        const finalMessage = finalStreak === 1
            ? `🎁 **${context.username}** ha reclamado su daily. Tu racha ha comenzado de nuevo. Bonus de racha: +${streakBonus}€. Total recibido: **${actualEarnings}€**${petMsg}`
            : `🎁 **${context.username}** ha reclamado su daily. Racha actual: **${finalStreak} días**. Bonus de racha: +${streakBonus}€. Total recibido: **${actualEarnings}€**${petMsg}`;

        context.reply(finalMessage);
    }

    #isWeekday(date) {
        return date.getDay() >= 1 && date.getDay() <= 5;
    }

    #isBusinessDay(date) {
        return date.getDay() >= 1 && date.getDay() <= 5;
    }

    #isNonCountDay(date) {
        return nonCountDays.includes(date.toISOString().split("T")[0]);
    }

    #getNextBusinessDay(date) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        while (!this.#isBusinessDay(nextDay)) {
            nextDay.setDate(nextDay.getDate() + 1);
        }
        return nextDay;
    }
}

export default new DailyCommand();