/**
 * @typedef {Object} JobProfile
 * @property {string} name - Username
 * @property {string} job - Job ID (miner, lumberjack, fisherman)
 * @property {number} toolLevel - Current tool level
 * @property {number} lastWork - Timestamp of the last /rpg work execution
 * @property {Object} activeBuffs - All current active buffs 
 * @property {number} prestigeLevel - Current prestige level
 */

export class JobRepository {
    /**
     * @param {import('../database/JsonDatabaseClient.js').JsonDatabaseClient} dbClient 
     */
    constructor(dbClient) {
        this.db = dbClient;
    }

    /**
     * Executes a transaction on the jobs collection.
     *
     * The provided callback receives the current job profiles and can
     * modify them atomically before the changes are persisted.
     *
     * @param {(jobs: JobProfile[]) => void} callback - Transaction logic to execute.
     * @returns {Promise<void>}
     */
    async executeTransaction(callback) {
        await this.db.update((jobs) => {
            callback(jobs);
            return jobs;
        });
    }

    /**
     * Retrieves a user's job profile.
     *
     * If the user does not have a job profile yet, undefined is returned.
     *
     * @param {string} username - Username whose job profile should be retrieved.
     * @returns {Promise<JobProfile | undefined>} The user's job profile.
     */
    async getProfile(username) {
        const jobs = await this.db.read();
        return jobs.find(j => j.name === username);
    }

    /**
     * Ensures that the job exists within the current transaction.
     * @param {JobProfile[]} jobs 
     * @param {string} username 
     * @returns {JobProfile}
     */
    ensureJobProfile(jobs, username) {
        let profile = jobs.find(j => j.name === username);
        if (!profile) {
            profile = { name: username, job: null, toolLevel: 1, lastWork: 0, activeBuffs: {} };
            jobs.push(profile);
        }
        if (!profile.activeBuffs) profile.activeBuffs = {};
        return profile;
    }
}