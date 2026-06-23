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

    /**
     * Ensures that the wallet exists within the current transaction.
     * @param {Wallet[]} wallets 
     * @param {string} username 
     * @returns {Wallet}
     */
    ensureWallet(wallets, username) {
        let wallet = wallets.find(w => w.name === username);
        if (!wallet) {
            wallet = { name: username, money: 100, debt: 0 };
            wallets.push(wallet);
        }
        return wallet;
    }
}