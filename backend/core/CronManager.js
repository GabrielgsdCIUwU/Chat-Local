import crypto from "node:crypto";
import { GAME_CONFIG } from "./constants.js";
export class CronManager {
    /**
     * 
     * @param {import('../services/MarketService.js').MarketService} marketService 
     * @param {import('../services/RPGService.js').RPGService} rpgService 
     * @param {import('../services/RaidService.js').RaidService} raidService 
     */
    constructor(marketService, rpgService, raidService) {
        this.marketService = marketService;
        this.rpgService = rpgService;
        this.raidService = raidService;
    }

    startAll(io) {
        console.log("⚙️ Inicializando tareas en segundo plano (Cron Jobs)...");
        this.#startMarketCron();
        this.#startExpeditionsCron(io);
        this.#startRandomRaidCron(io);
    }

    #startMarketCron() {
        const INTERVAL_MS = 60 * 60 * 1000;

        setInterval(async () => {
            try {
                await this.marketService.checkExpiredAuctions();
            } catch (error) {
                console.error("[CRON ERROR] Fallo al comprobar subastas en el MarketService:", error);
            }
        }, INTERVAL_MS);
    }

    #startExpeditionsCron(io) {
        setInterval(async () => {
            try {
                const finished = await this.rpgService.processFinishedExpeditions();
                for (const result of finished) {
                    const lootText = Object.entries(result.loot)
                        .map(([item, amount]) => `${amount}x ${item}`).join(", ");

                    io.emit("sendmsg", {
                        id: crypto.randomUUID(),
                        user: "🤖 Sistema",
                        message: `🏕️ ¡El personaje de **${result.username}** ha vuelto de **${result.zoneName}**!\n📦 **Botín traído:** ${lootText}`,
                        timestamp: Date.now()
                    });
                }
            } catch (error) {
                console.error("[CRON ERROR Expeditions]:", error);
            }
        }, 60 * 1000)
    }

    #startRandomRaidCron(io) {
        const scheduleNextRaid = () => {
            const minTimeMs = GAME_CONFIG.BOSS_CONFIG.MIN_TIME_TO_SHOW;
            const maxTimeMs = GAME_CONFIG.BOSS_CONFIG.MAX_TIME_TO_SHOW;
            const nextRunMs = Math.floor(Math.random() * (maxTimeMs - minTimeMs + 1)) + minTimeMs;

            setTimeout(() => {
                this.raidService.startRaid(io);
                scheduleNextRaid()
            }, nextRunMs);
        };

        scheduleNextRaid();
    }
}