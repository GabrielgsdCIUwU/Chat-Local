/**
 * @typedef {Object} Gambler
 * @property {string} name
 * @property {number} money
 * @property {number} totalEarnings
 * @property {number} spend
 * @property {number} timesSteal
 * @property {number} moneySteal
 * @property {number} duelWin
 * @property {number} duelLose
 * @property {number} bankRupt
 * @property {number} debt
 * @property {number} [donated]
 * @property {number} [lastDaily]
 * @property {number} [dailyStreak]
 */

 export class GamblingRepository {
    /**
     * @param {import('../database/JsonDatabaseClient.js').JsonDatabaseClient} dbClient 
     */
    constructor(dbClient) {
        this.db = dbClient;
    }

    /**
     * Executes a transaction on the gambling database safely.
     * @param {funtion(Gambler[]: void)} callback - Callback that mutates the users array.
     * @returns {Promise<void>} 
     */
    async executeTransaction(callback) {
        await this.db.update((users) => {
            callback(users);
            return users;
        })
    }
 }