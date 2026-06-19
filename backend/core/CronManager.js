export class CronManager {
    /**
     * 
     * @param {import('../services/MarketService.js').MarketService} marketService 
     * @param {import('../services/RPGService.js').RPGService} rpgService 
     */
    constructor(marketService, rpgService) {
        this.marketService = marketService;
        this.rpgService = rpgService;
    }

    startAll(io) {
        console.log("⚙️ Inicializando tareas en segundo plano (Cron Jobs)...");
        this.#startMarketCron();
        this.#startExpeditionsCron(io);
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
}