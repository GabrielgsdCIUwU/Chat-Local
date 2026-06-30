import { Entity } from '../../core/domain/Entity.js';
import { GAME_CONFIG } from '../../core/constants.js';

/**
 * @typedef {Object} GamblerProps
 * @property {string} name - Username.
 * @property {number} totalEarnings - Accumulative winning balance.
 * @property {number} spend - Accumulative spending.
 * @property {number} timesSteal - Successive robbery attempts.
 * @property {number} moneySteal - Amount stolen.
 * @property {number} duelWin - Matches won.
 * @property {number} duelLose - Matches lost.
 * @property {number} bankRupt - Count of bankruptcy calls.
 * @property {number} lastRobbery - Timestamp of the last heist.
 * @property {number} lastDaily - Timestamp of the last daily reward.
 * @property {number} dailyStreak - Consecutive daily reward streak.
 */

/**
 * Represents a Player Gambler statistics and cooldown profile.
 * Encapsulates gambling spending, earnings, bankruptcy metrics, duel tracking, and heists.
 * 
 * @extends {Entity<GamblerProps>}
 */
export class Gambler extends Entity {
    /**
     * @param {GamblerProps} props 
     */
    constructor(props) {
        super(props, props.name);
    }

    /** @returns {string} */
    get name() { return this._props.name; }

    /** @returns {number} */
    get totalEarnings() { return this._props.totalEarnings; }

    /** @returns {number} */
    get spend() { return this._props.spend; }

    /** @returns {number} */
    get timesSteal() { return this._props.timesSteal; }

    /** @returns {number} */
    get moneySteal() { return this._props.moneySteal; }

    /** @returns {number} */
    get duelWin() { return this._props.duelWin; }

    /** @returns {number} */
    get duelLose() { return this._props.duelLose; }

    /** @returns {number} */
    get bankRupt() { return this._props.bankRupt; }

    /** @returns {number} */
    get lastRobbery() { return this._props.lastRobbery; }

    /** @returns {number} */
    get lastDaily() { return this._props.lastDaily; }

    /** @returns {number} */
    get dailyStreak() { return this._props.dailyStreak; }

    /**
     * Adds expenditures to the gambler's metrics.
     * @param {number} amount - Spending amount.
     */
    recordSpend(amount) {
        if (amount <= 0) return;
        this._props.spend += amount;
    }

    /**
     * Adds earnings to the gambler's metrics.
     * @param {number} amount - Won amount.
     */
    recordEarnings(amount) {
        if (amount <= 0) return;
        this._props.totalEarnings += amount;
    }

    /**
     * Increments the bankruptcy count.
     */
    recordBankruptcy() {
        this._props.bankRupt += 1;
    }

    /**
     * Registers a win in dual matches.
     */
    recordDuelWin() {
        this._props.duelWin += 1;
    }

    /**
     * Registers a loss in dual matches.
     */
    recordDuelLose() {
        this._props.duelLose += 1;
    }

    /**
     * Verifies and records a heist (robbery) attempt.
     * @param {number} timestamp - The current timestamp.
     * @param {number} stolenAmount - The cash stolen (if successful).
     * @param {boolean} success - Whether the robbery succeeded.
     * @throws {Error} If robbery cooldown has not expired.
     */
    executeRobbery(timestamp, stolenAmount, success) {
        const cooldown = GAME_CONFIG.ROB_CONFIG.COOLDOWN_MS;
        const timePassed = timestamp - this._props.lastRobbery;

        if (timePassed < cooldown) {
            const remainingMs = cooldown - timePassed;
            const remainingMinutes = Math.floor(remainingMs / 60000);
            const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
            throw new Error(`🚨 **Buscado por la policía:** Debes permanecer escondido durante **${remainingMinutes}m y ${remainingSeconds}s** antes de intentar robar de nuevo.`);
        }

        this._props.lastRobbery = timestamp;
        this._props.timesSteal += 1;

        if (success && stolenAmount > 0) {
            this._props.moneySteal += stolenAmount;
        }
    }

    /**
     * Verifies and records a daily reward claim.
     * @param {number} timestamp - The current timestamp.
     * @param {boolean} keepStreak - Whether the consecutive streak should be incremented or reset.
     * @throws {Error} If the daily cooldown is still active.
     */
    claimDaily(timestamp, keepStreak) {
        const cooldown = GAME_CONFIG.GAMBLING.DAILY.COOLDOWN_MS;
        const timePassed = timestamp - this._props.lastDaily;

        if (timePassed < cooldown) {
            const timeLeft = cooldown - timePassed;
            const hours = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            throw new Error(`Ya has reclamado tu recompensa diaria. Tiempo restante: ${hours}h ${minutes}m.`);
        }

        this._props.lastDaily = timestamp;

        if (keepStreak) {
            this._props.dailyStreak += 1;
        } else {
            this._props.dailyStreak = 1;
        }
    }

    /**
     * Plain data serialization.
     * @returns {GamblerProps}
     */
    toJSON() {
        return {
            name: this.name,
            totalEarnings: this.totalEarnings,
            spend: this.spend,
            timesSteal: this.timesSteal,
            moneySteal: this.moneySteal,
            duelWin: this.duelWin,
            duelLose: this.duelLose,
            bankRupt: this.bankRupt,
            lastRobbery: this.lastRobbery,
            lastDaily: this.lastDaily,
            dailyStreak: this.dailyStreak
        };
    }
}