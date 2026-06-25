/**
 * @typedef {Object} BossData
 * @property {number} maxHp - The dynamic max HP of the boss.
 */

export class BossRepository {
    /**
     * 
     * @param {import('../database/JsonDatabaseClient').JsonDatabaseClient} dbClient 
     */
    constructor(dbClient) {
        this.db = dbClient;
    }

    /**
     * Retrieves the current max HP of the boss.
     * @param {number} defaultHP - The fallback HP if it hasn't been set yet.
     * @returns {Promise<number>}
     */
    async getMaxHp(defaultHP) {
        const data = await this.db.read();

        if (!Array.isArray(data) && data.maxHp) {
            return data.maxHp;
        } else if (Array.isArray(data) && data.length > 0 && data[0].maxHp) {
            return data[0].maxHp;
        }

        return defaultHP;
    }

    /**
     * Updates the max HP of the boss.
     * @param {number} maxHp - The new maximum HP to persist.
     * @returns {Promise<void>}
     */
    async setMaxHp(maxHp) {
        await this.db.update((data) => {
            if (Array.isArray(data)) {
                if (data.length === 0) data.push({ maxHp });
                else data[0].maxHp = maxHp;
                return data;
            }
            return { ...data, maxHp };
        });
    }
}