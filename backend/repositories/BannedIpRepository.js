/**
 * @typedef {Object} BannedIp
 * @property {string} ip - The banned IP address.
 * @property {string} motivo - The reason for the ban.
 */

export class BannedIpRepository {
    /**
     * @param {import('../database/JsonDatabaseClient.js').JsonDatabaseClient} dbClient 
     */
    constructor(dbClient) {
        this.db = dbClient;
    }

    /**
     * Checks if a specific IP address is currently banned.
     * @param {string} ip - The IP address to check.
     * @returns {Promise<BannedIp | undefined>} The ban record if found, otherwise undefined.
     */
    async isBanned(ip) {
        const bannedIPs = await this.db.read();
        return bannedIPs.find(banned => banned.ip === ip);
    }
}