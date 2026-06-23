/**
 * @typedef {Object} PetInstance
 * @property {string} id - Unique identifier for the pet instance (UUID).
 * @property {string} type - The pet type key matching the RPG_CONFIG.PETS dictionary.
 */

/**
 * @typedef {Object} PetProfile
 * @property {string} name - Username of the pet owner.
 * @property {number} eggs - Number of unhatched eggs the user owns.
 * @property {PetInstance[]} pets - Array of pets the user has hatched.
 * @property {string|null} equipped - The ID of the currently equipped pet, or null.
 */

export class PetRepository {
    /**
     * @param {import('../database/JsonDatabaseClient.js').JsonDatabaseClient} dbClient 
     */
    constructor(dbClient) {
        this.db = dbClient;
    }

    /**
     * Executes a thread-safe transaction on the pet profiles array.
     * @param {function(PetProfile[]): void} callback - Mutation function.
     * @returns {Promise<void>}
     */
    async executeTransaction(callback) {
        await this.db.update(async (profiles) => {
            await callback(profiles);
            return profiles;
        });
    }

    /**
     * Retrieves the pet profile for a specific user.
     * @param {string} username - The user to lookup.
     * @returns {Promise<PetProfile>} The user's pet profile.
     */
    async getProfile(username) {
        const profiles = await this.db.read();
        return profiles.find(p => p.name === username) || { name: username, eggs: 0, pets: [], equipped: null };
    }

    /**
     * Ensures a pet profile exists within a transaction context.
     * @param {PetProfile[]} profiles - The current array of profiles.
     * @param {string} username - The user to ensure.
     * @returns {PetProfile} The existing or newly created profile reference.
     */
    ensureProfile(profiles, username) {
        let profile = profiles.find(p => p.name === username);
        if (!profile) {
            profile = { name: username, eggs: 0, pets: [], equipped: null };
            profiles.push(profile);
        }
        return profile;
    }
}