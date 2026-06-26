import { Entity } from '../../core/domain/Entity.js';
import { GAME_CONFIG } from '../../core/constants.js';

/**
 * @typedef {Object} WalletProps
 * @property {string} name - The username owning the wallet.
 * @property {number} money - Current balance.
 * @property {number} debt - Current debt.
 */

/**
 * Represents a user's Economy Wallet.
 * Encapsulates all business rules regarding money transactions.
 * 
 * @extends {Entity<WalletProps>}
 */
export class Wallet extends Entity {
    /**
     * @param {WalletProps} props 
     */
    constructor(props) {
        super(props, props.name);
    }

    get name() { return this._props.name; }
    get money() { return this._props.money; }
    get debt() { return this._props.debt; }

    /**
     * Adds funds to the wallet, paying off debt automatically if any.
     * @param {number} amount - Positive amount to add.
     * @returns {number} The net amount added to the balance after debt deduction.
     */
    addFunds(amount) {
        let actualEarnings = amount;
        
        if (this._props.debt > 0) {
            let payDebt = Math.floor(amount * GAME_CONFIG.ECONOMY.DEBT_REPAY_PERCENTAGE);
            if (payDebt > this._props.debt) payDebt = this._props.debt;

            this._props.debt -= payDebt;
            actualEarnings = amount - payDebt;
        }
        
        this._props.money += actualEarnings;
        return actualEarnings;
    }

    /**
     * Removes funds strictly. Fails if insufficient funds.
     * @param {number} amount - Positive amount to remove.
     * @throws {Error} If wallet has insufficient funds.
     */
    removeFunds(amount) {
        if (this._props.money < amount) {
            throw new Error(`No tienes suficiente dinero. Tienes ${this._props.money}€`);
        }
        this._props.money -= amount;
    }

    /**
     * Removes up to the available balance without throwing errors.
     * @param {number} amount - Desired amount to remove.
     * @returns {number} The actual amount removed.
     */
    forceRemoveFunds(amount) {
        const removedAmount = Math.min(this._props.money, amount);
        this._props.money -= removedAmount;
        return removedAmount;
    }

    /**
     * Declares bankruptcy, resetting money and increasing debt.
     * @param {number} bankRuptCount - Historical bankruptcies multiplier.
     * @throws {Error} If user still has money.
     */
    declareBankruptcy(bankRuptCount) {
        if (this._props.money > 0) {
            throw new Error(`Tienes ${this._props.money}€, no puedes declararte en bancarrota`);
        }

        const baseMoney = GAME_CONFIG.ECONOMY.BANKRUPT_BASE_MONEY;
        this._props.money = baseMoney;
        this._props.debt += baseMoney + Math.floor(Math.random() * bankRuptCount * GAME_CONFIG.ECONOMY.BANKRUPT_PENALTY_MULT);
    }

    /**
     * Serializes the entity back to a plain Database Object.
     * @returns {WalletProps}
     */
    toJSON() {
        return {
            name: this.name,
            money: this.money,
            debt: this.debt
        };
    }
}