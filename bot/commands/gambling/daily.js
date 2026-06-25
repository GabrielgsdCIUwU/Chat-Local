import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { GAME_CONFIG } from "../../../backend/core/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = resolve(__dirname, "../../../public/json/nonCountDays.json");
const data = await readFile(filePath, "utf-8");
const nonCountDays = JSON.parse(data);

export const description = "Reclama tu recompensa diaria de dinero. ¡Manten la racha para ganar bonus!";

/**
 * @param {import("../../core/BotContext.js").BotContext} context 
 */
export async function execute(context) {
    const baseAmount = GAME_CONFIG.DAILY_BASE_REWARD;
    const twelveHours = 12 * 60 * 60 * 1000;
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const now = new Date(context.timestamp);

    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5; // Lunes a viernes

    if (!isWeekday) {
        return context.reply(`${context.username}, solo puedes reclamar el daily de lunes a viernes.`);
    }

    // Funciones de validación de fechas
    function isBusinessDay(date) {
        const day = date.getDay();
        return day >= 1 && day <= 5; // Lunes a viernes
    }

    // Función para obtener el siguiente día laborable después de una fecha
    function getNextBusinessDay(date) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        while (!isBusinessDay(nextDay)) {
            nextDay.setDate(nextDay.getDate() + 1);
        }
        return nextDay;
    }

    function isNonCountDay(date) {
        const formatted = date.toISOString().split("T")[0];
        return nonCountDays.includes(formatted);
    }

    try {
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
                const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
                
                throw new Error(`ya has reclamado tu recompensa diaria. Tiempo restante: ${hours} horas, ${minutes} minutos, ${seconds} segundos.`);
            }

            // Lógica de rachas
            let streakBroken = false;

            if (user.lastDaily === 0) {
                user.dailyStreak = 1;
            } else {
                const lastDailyDate = new Date(user.lastDaily);

                if (isBusinessDay(lastDailyDate) || isNonCountDay(lastDailyDate)) {
                    const nextExpectedBusinessDay = getNextBusinessDay(lastDailyDate);
                    
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

            const randomBonusFactor = Math.floor(Math.random() * (100 - 25 + 1)) + 25;
            streakBonus = user.dailyStreak * randomBonusFactor;
            baseTotal = baseAmount + streakBonus;
        });

        const { actualEarnings, petMsg } = await context.container.gamblingService.addRewardWithBonus(context.username, baseTotal);

        await context.container.gamblingRepository.executeTransaction(async (users) => {
            const user = context.container.gamblingRepository.ensureUser(users, context.username);
            user.totalEarnings = (user.totalEarnings || 0) + actualEarnings;
        });

        const finalMessage = finalStreak === 1
            ? `${context.username} ha reclamado su daily. Tu racha ha comenzado de nuevo. Bonus de racha: +${streakBonus}€. Total recibido: ${actualEarnings}€${petMsg}`
            : `${context.username} ha reclamado su daily. Racha actual: ${finalStreak} días. Bonus de racha: +${streakBonus}€. Total recibido: ${actualEarnings}€${petMsg}`;
        
        context.reply(finalMessage);

    } catch (error) {
        context.reply(`${context.username}, ${error.message}`);
    }
} 