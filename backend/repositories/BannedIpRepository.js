export class BannedIpRepository {
    constructor(dbClient) {
        this.db = dbClient;
    }

    async isBanned(ip) {
        const bannedIPs = await this.db.read();
        return bannedIPs.find(banned => banned.ip === ip);
    }
}