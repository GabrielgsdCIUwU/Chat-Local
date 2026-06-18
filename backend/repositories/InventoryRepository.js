/**
 * @typedef {Object} UserInventory
 * @property {string} name - Username
 * @property {Object.<string, number>} items - Items map and quantity
 */

export class InventoryRepository {
    /**
     * @param {import('../database/JsonDatabaseClient.js').JsonDatabaseClient} dbClient 
     */
    constructor(dbClient) {
        this.db = dbClient;
    }

    /**
     * Executes a transaction on the inventories collection.
     *
     * The provided callback receives the current inventories and can
     * modify them atomically before the changes are persisted.
     *
     * @param {(inventories: UserInventory[]) => void} callback - Transaction logic to execute.
     * @returns {Promise<void>}
     */
    async executeTransaction(callback) {
        await this.db.update((inventories) => {
            callback(inventories);
            return inventories;
        });
    }

    /**
     * Retrieves a user's inventory.
     *
     * If the user does not have an inventory yet, an empty inventory
     * object is returned.
     *
     * @param {string} username - Username whose inventory should be retrieved.
     * @returns {Promise<UserInventory>} The user's inventory.
     */
    async getInventory(username) {
        const inventories = await this.db.read();
        return inventories.find(i => i.name === username) || { name: username, items: {} };
    }
}