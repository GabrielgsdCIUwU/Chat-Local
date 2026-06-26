import { Wallet } from '../domain/economy/Wallet.js';


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
        await this.db.update((rawWallets) => {
            const wallets = rawWallets.map(w => new Wallet(w));
            callback(wallets);
            return wallets.map(w => w.toJSON());
        });
    }

    /**
     * Reads all wallets
     * @returns {Promise<Wallet[]>}
     */
    async getAll() {
        const rawWallets = await this.db.read();
        return rawWallets.map(w => new Wallet(w));
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
            wallet = new Wallet({ name: username, money: 100, debt: 0});
            wallets.push(wallet);
        }
        return wallet;
    }
}