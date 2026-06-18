export class CronManager {
    /**
     * 
     * @param {import('../services/MarketService.js').MarketService} marketService 
     */
    constructor(marketService) {
        this.marketService = marketService;
    }

    startAll() {
        console.log("⚙️ Inicializando tareas en segundo plano (Cron Jobs)...");
        this.#startMarketCron();
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
}