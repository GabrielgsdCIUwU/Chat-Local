/** @typedef {import('../core/types.js').IBannedIpRepository} IBannedIpRepository */
/** @typedef {import('../core/types.js').BannedIp} BannedIp */

/**
 * Repository to audit IP security limits and bans.
 * 
 * @implements {IBannedIpRepository}
 */
export class BannedIpRepository {
    /**
     * @param {import('../core/types.js').IKeyValueStore} dbClient 
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
        return bannedIPs.find((/** @type {BannedIp} */ banned) => banned.ip === ip);
    }
}