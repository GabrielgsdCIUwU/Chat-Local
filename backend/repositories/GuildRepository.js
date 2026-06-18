/**
 * @typedef {Object} GuildMember
 * @property {string} name - Username of the member.
 * @property {string} rank - Rank in the guild (e.g., "Leader", "Officer", "Member").
 */

/**
 * @typedef {Object} Guild
 * @property {string} id - Unique guild ID.
 * @property {string} name - Display name of the guild.
 * @property {number} level - Current guild level.
 * @property {number} bankMoney - Money stored in the guild bank.
 * @property {GuildMember[]} members - Array of guild members.
 */

export class GuildRepository {
    /**
     * 
     * @param {import('../database/JsonDatabaseClient.js').JsonDatabaseClient} dbClient 
     */
    constructor(dbClient) {
        this.db = dbClient;
    }

    /**
     * Executes a thread-safe transaction on the guilds array.
     * @param {function(Guild[]): void} callback
     * @returns {Promise<void>}
     */
    async executeTransaction(callback) {
        await this.db.update((guilds) => {
            callback(guilds);
            return guilds;
        });
    }

    /**
     * Retrieves all guilds.
     * @returns {Promise<Guild[]>}
     */
    async getAll() {
        return await this.db.read();
    }
}