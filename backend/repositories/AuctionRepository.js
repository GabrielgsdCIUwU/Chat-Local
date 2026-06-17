/**
 * @typedef {Object} AuctionItem
 * @property {string} id - Unique identifier for the auction.
 * @property {string} seller - Username of the player selling the item.
 * @property {string} itemName - Name of the RPG material being sold.
 * @property {number} amount - Quantity of the item.
 * @property {number} price - Total price requested for the bundle.
 * @property {number} expiresAt - Unix timestamp representing when the auction expires.
 */

export class AuctionRepository {
    /**
     * 
     * @param {import('../database/JsonDatabaseClient.js').JsonDatabaseClient} dbClient 
     */
    constructor(dbClient) {
        this.db = dbClient;
    }

    /**
     * Executes a thread-safe transaction on the auctions array.
     * @param {function(AuctionItem[]): void} callback - Mutation function.
     * @returns {Promise<void>}
     */
    async executeTransaction(callback) {
        await this.db.update((auctions) => {
            callback(auctions);
            return auctions;
        });
    }

    /**
     * Retrieves all active auctions.
     * @returns {Promise<AuctionItem[]>} Array of active auctions.
     */
    async getAll() {
        return await this.db.read();
    }

    /**
     * Safely removes and auction by ID.
     * @param {string} id - The auction ID.
     * @returns {Promise<boolean>} True if the auction was successfully removed, false if not found.
     */
    async removeAuction(id) {
        let wasRemoved = false;
        await this.db.update((auctions) => {
            const index = auctions.findIndex(a => a.id === id);
            if (index !== -1) {
                auctions.splice(index, 1);
                wasRemoved = true;
            }
            return auctions;
        });
        return wasRemoved;
    }
}