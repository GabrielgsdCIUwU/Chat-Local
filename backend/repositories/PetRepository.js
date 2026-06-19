export class PetRepository {
    /**
     * @param {import('../database/JsonDatabaseClient.js').JsonDatabaseClient} dbClient 
     */
    constructor(dbClient) {
        this.db = dbClient;
    }

    async executeTransaction(callback) {
        await this.db.update(async (profiles) => {
            await callback(profiles);
            return profiles;
        });
    }

    async getProfile(username) {
        const profiles = await this.db.read();
        return profiles.find(p => p.name === username) || { name: username, eggs: 0, pets: [], equipped: null };
    }

    ensureProfile(profiles, username) {
        let profile = profiles.find(p => p.name === username);
        if (!profile) {
            profile = { name: username, eggs: 0, pets: [], equipped: null };
            profiles.push(profile);
        }
        return profile;
    }
}