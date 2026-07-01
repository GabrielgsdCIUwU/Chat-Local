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
     * Factory method to create a default Gambler aggregate root.
     * @param {string} username - The gambler's username.
     * @returns {Gambler} A brand new Gambler aggregate instance with default values.
     */
    static createDefault(username) {
        return new Gambler({
            name: username,
            totalEarnings: 0,
            spend: 0,
            timesSteal: 0,
            moneySteal: 0,
            duelWin: 0,
            duelLose: 0,
            bankRupt: 0,
            lastRobbery: 0,
            lastDaily: 0,
            dailyStreak: 0
        });
    }

    /**
     * Records additional monetary expenditure into gambling statistics.
     * @param {number} amount - Amount spent.
     * @returns {void}
     */
    recordSpend(amount) {
        if (amount <= 0) return;
        this._props.spend += amount;
    }

    /**
     * Records won earnings into gambling statistics.
     * @param {number} amount - Amount won.
     * @returns {void}
     */
    recordEarnings(amount) {
        if (amount <= 0) return;
        this._props.totalEarnings += amount;
    }

    /**
     * Increments the bankruptcy count.
     * @returns {void}
     */
    recordBankruptcy() {
        this._props.bankRupt += 1;
    }

    /**
     * Registers a win in duel matches.
     * @returns {void}
     */
    recordDuelWin() {
        this._props.duelWin += 1;
    }

    /**
     * Registers a loss in duel matches.
     * @returns {void}
     */
    recordDuelLose() {
        this._props.duelLose += 1;
    }

    /**
     * Validates if the robbery action is on cooldown.
     * @param {number} timestamp - The current epoch timestamp.
     * @throws {Error} If cooldown has not expired yet.
     * @returns {void}
     */
    checkRobberyCooldown(timestamp) {
        const cooldown = GAME_CONFIG.ROB_CONFIG.COOLDOWN_MS;
        const timePassed = timestamp - this._props.lastRobbery;

        if (timePassed < cooldown) {
            throw new Error(this.#formatCooldownError(cooldown - timePassed));
        }
    }

    /**
     * Sets the timestamp of the last robbery attempt and increments attempts.
     * @param {number} timestamp - Current epoch timestamp.
     * @returns {void}
     */
    markRobberyAttempt(timestamp) {
        this._props.lastRobbery = timestamp;
        this._props.timesSteal += 1;
    }

    /**
     * Determines and updates the current daily streak depending on calendar parameters.
     * 
     * @param {number} timestamp - The current action epoch timestamp.
     * @param {string[]} nonCountDays - List of ignored ISO date strings (e.g. holidays).
     * @throws {Error} If the 12-hour claim cooldown is still active.
     * @returns {{ streak: number, isNewStreak: boolean }} The resulting streak metrics.
     */
    calculateDailyStreak(timestamp, nonCountDays) {
        const twelveHours = GAME_CONFIG.GAMBLING.DAILY.COOLDOWN_MS;
        const twentyFourHours = GAME_CONFIG.GAMBLING.DAILY.EXPIRATION_MS;
        const now = new Date(timestamp);

        const timeSinceLastDaily = timestamp - this._props.lastDaily;
        if (timeSinceLastDaily < twelveHours) {
            const timeLeft = twelveHours - timeSinceLastDaily;
            const hours = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            throw new Error(`Ya has reclamado tu recompensa diaria. Tiempo restante: ${hours}h ${minutes}m.`);
        }

        let keepStreak = false;

        if (this._props.lastDaily === 0) {
            this._props.dailyStreak = 1;
        } else {
            const lastDailyDate = new Date(this._props.lastDaily);
            const isBusinessDay = (/** @type {Date} */ d) => d.getDay() >= 1 && d.getDay() <= 5;
            const isNonCountDay = (/** @type {Date} */ d) => nonCountDays.includes(d.toISOString().split("T")[0]);

            const getNextBusinessDay = (/** @type {Date} */ d) => {
                const nextDay = new Date(d);
                nextDay.setDate(nextDay.getDate() + 1);
                while (!(nextDay.getDay() >= 1 && nextDay.getDay() <= 5)) {
                    nextDay.setDate(nextDay.getDate() + 1);
                }
                return nextDay;
            };

            if (isBusinessDay(lastDailyDate) || isNonCountDay(lastDailyDate)) {
                const nextExpectedBusinessDay = getNextBusinessDay(lastDailyDate);

                if (now.getTime() <= nextExpectedBusinessDay.getTime() + twentyFourHours) {
                    if (now.toDateString() === nextExpectedBusinessDay.toDateString() ||
                        now.getTime() <= nextExpectedBusinessDay.getTime() + twentyFourHours) {
                        keepStreak = true;
                    }
                }
            }

            if (now.getDay() === 1 && lastDailyDate.getDay() === 5) {
                const daysSinceFriday = Math.floor((now.getTime() - lastDailyDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceFriday <= 4) {
                    keepStreak = true;
                }
            }

            if (keepStreak) {
                this._props.dailyStreak += 1;
            } else {
                this._props.dailyStreak = 1;
            }
        }

        this._props.lastDaily = timestamp;

        return {
            streak: this._props.dailyStreak,
            isNewStreak: this._props.dailyStreak === 1
        };
    }

    /**
     * Reverts the last registered bankruptcy counter.
     * This is an application-level rollback helper to maintain statistical consistency.
     * 
     * @returns {void}
     */
    revertBankruptcy() {
        if (this._props.bankRupt > 0) {
            this._props.bankRupt -= 1;
        }
    }

    /**
     * @param {number} timeLeftMs - Milliseconds left on cooldown.
     * @returns {string} Mapped readable string.
     */
    #formatCooldownError(timeLeftMs) {
        const minutes = Math.floor(timeLeftMs / 60000);
        const seconds = Math.floor((timeLeftMs % 60000) / 1000);
        return `🚨 **Buscado por la policía:** Debes permanecer escondido durante **${minutes}m y ${seconds}s** antes de intentar robar de nuevo.`;
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