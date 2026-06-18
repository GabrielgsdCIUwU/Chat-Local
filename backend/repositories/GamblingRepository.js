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
     * Ensures a gambler exists. If not, initializes a new profile.
     * @param {Gambler[]} users 
     * @param {string} username 
     * @returns {Gambler}
     */
    ensureUser(users, username) {
        let user = users.find(u => u.name === username);
        if (!user) {
            user = {
                name: username, totalEarnings: 0, spend: 0,
                timesSteal: 0, moneySteal: 0, duelWin: 0, duelLose: 0,
                bankRupt: 0
            };
            users.push(user);
        }
        return user;
    }

    /**
     * Executes a transaction on the gambling database safely.
     * @param {funtion(Gambler[]: void)} callback - Callback that mutates the users array.
     * @returns {Promise<void>} 
     */
    async executeTransaction(callback) {
        await this.db.update(async (users) => {
            await callback(users);
            return users;
        })
    }
 }