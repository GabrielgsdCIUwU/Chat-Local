import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { calculateNetEarnings } from "../../utility/calculateNetEarnings.js";
import { GAME_CONFIG } from "../../../backend/core/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = resolve(__dirname, "../../../public/json/nonCountDays.json");
const data = await readFile(filePath, "utf-8");
const nonCountDays = JSON.parse(data);

/**
 * @param {import("./types/CommandContext.js").GamblingContext} context 
 */

export function execute(context) {
    const baseAmount = GAME_CONFIG.DAILY_BASE_REWARD;
    const twelveHours = 12 * 60 * 60 * 1000;
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const user = context.currentUser;
    const now = new Date(context.timestamp);

    // Inicializar valores si no existen
    if (!user.lastDaily) user.lastDaily = 0;
    if (!user.dailyStreak) user.dailyStreak = 0;

    const timeSinceLastDaily = context.timestamp - user.lastDaily;
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5; // Lunes a viernes

    // Verificar si es día laborable
    if (!isWeekday) {
        context.reply(`${context.username}, solo puedes reclamar el daily de lunes a viernes.`)
        return;
    }

    // Verificar si han pasado al menos 12 horas
    if (timeSinceLastDaily < twelveHours) {
        const timeLeft = twelveHours - timeSinceLastDaily;
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

        context.reply(`${context.username}, ya has reclamado tu recompensa diaria. Tiempo restante: ${hours} horas, ${minutes} minutos, ${seconds} segundos.`)
        return;
    }

    // Función para verificar si un día es laborable
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
        return nonCountDays.includes(formatted)
    }


    // Lógica de rachas
    let streakBroken = false;

    if (user.lastDaily === 0) {
        // Primer daily
        user.dailyStreak = 1;
    } else {
        const lastDailyDate = new Date(user.lastDaily);

        // Si el último daily fue en día laborable y que no sea festivo
        if (isBusinessDay(lastDailyDate) || isNonCountDay(lastDailyDate)) {
            const nextExpectedBusinessDay = getNextBusinessDay(lastDailyDate);
            
            // Verificar si estamos dentro del rango permitido
            if (now.getTime() <= nextExpectedBusinessDay.getTime() + twentyFourHours) {
                // Mantener racha si:
                // 1. Estamos en el siguiente día laborable, O
                // 2. Estamos dentro de las 24h del siguiente día laborable
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
            // El último daily no fue en día laborable (esto no debería pasar, pero por seguridad)
            streakBroken = true;
        }

        // Casos especiales para mantener racha de viernes a lunes
        if (now.getDay() === 1) { // Si hoy es lunes
            const lastDailyDate = new Date(user.lastDaily);
            if (lastDailyDate.getDay() === 5) { // Y el último daily fue viernes
                const daysSinceFriday = Math.floor((now.getTime() - lastDailyDate.getTime()) / (1000 * 60 * 60 * 24));
                
                // Mantener racha si no han pasado más de 4 días (viernes + fin de semana + hasta 24h del lunes)
                if (daysSinceFriday <= 4) {
                    user.dailyStreak += 1;
                    streakBroken = false;
                }
            }
        }

        if (streakBroken) {
            user.dailyStreak = 1;
        }
    }

    // Calcular recompensa
    const randomBonusFactor = Math.floor(Math.random() * (100 - 25 + 1)) + 25;
    const streakBonus = user.dailyStreak * randomBonusFactor;
    const totalReward = baseAmount + streakBonus;
    const actualEarnings = context.container.economyService.addFunds(context.username, totalReward);

    // Aplicar recompensa
    user.money += actualEarnings;
    user.totalEarnings += totalReward;
    user.lastDaily = context.timestamp;

    // Mensaje de confirmación
    const message = user.dailyStreak === 1
        ? `${context.username} ha reclamado su daily. Tu racha ha comenzado de nuevo. Bonus: +${streakBonus}€. Total recibido: ${actualEarnings}€`
        : `${context.username} ha reclamado su daily. Racha actual: ${user.dailyStreak} días. Bonus: +${streakBonus}€. Total recibido: ${actualEarnings}€`;

    context.reply(message)
}