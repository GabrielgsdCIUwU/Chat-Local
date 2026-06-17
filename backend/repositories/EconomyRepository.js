/**
 * @typedef {Object} Wallet
 * @property {string} name - Username
 * @property {number} money - Current balance
 * @property {number} debt - Current debt
 */

export class EconomyRepository {
    /**
     * 
     * @param {import('../database/JsonDatabaseClient.js').JsonDatabaseClient} dbClient 
     */
    constructor(dbClient) {
        this.db = dbClient;
    }

    /**
     * Executes a transaction safely
     * @param {function(Wallet[]): void} callback 
     */
    async executeTransaction(callback) {
        await this.db.update((wallets) => {
            callback(wallets);
            return wallets;
        });
    }

    /**
     * Reads all wallets
     * @returns {Promise<Wallet[]>}
     */
    async getAll() {
        return await this.db.read();
    }
}