import { Entity } from '../../core/domain/Entity.js';
import { GAME_CONFIG } from '../../core/constants.js';
import { Money } from "./Money.js";

/**
 * @typedef {Object} WalletProps
 * @property {string} name - The username owning the wallet.
 * @property {Money} money - Current balance.
 * @property {Money} debt - Current debt.
 */

/**
 * Represents a user's Economy Wallet.
 * Encapsulates all business rules regarding money transactions.
 * 
 * @extends {Entity<WalletProps>}
 */
export class Wallet extends Entity {
    /**
     * @param {Object} props - Initial raw wallet properties.
     * @param {string} props.name - Wallet owner name.
     * @param {number} props.money - Money balance.
     * @param {number} props.debt - Debt balance.
     */
    constructor(props) {
        super({
            name: props.name,
            money: new Money(props.money),
            debt: new Money(props.debt)
        }, props.name);
    }

    /** @returns {string} */
    get name() { return this._props.name; }

    /** @returns {number} */
    get money() { return this._props.money.amount; }

    /** @returns {number} */
    get debt() { return this._props.debt.amount; }

    /**
     * Adds funds to the wallet, paying off debt automatically if any.
     * @param {number} amount - Positive amount to add.
     * @returns {number} The net amount added to the balance after debt deduction.
     */
    addFunds(amount) {
        const inputMoney = new Money(amount);
        let actualEarnings = inputMoney;

        if (this.debt > 0) {
            const repaymentRatio = GAME_CONFIG.ECONOMY.DEBT_REPAY_PERCENTAGE;
            let payDebt = inputMoney.multiply(repaymentRatio);
            
            if (payDebt.amount > this.debt) {
                payDebt = this._props.debt;
            }

            this._props.debt = this._props.debt.subtract(payDebt);
            actualEarnings = inputMoney.subtract(payDebt);
        }

        this._props.money = this._props.money.add(actualEarnings);
        return actualEarnings.amount;
    }

    /**
     * Removes funds strictly. Fails if insufficient funds.
     * @param {number} amount - Positive amount to remove.
     */
    removeFunds(amount) {
        const toSubtract = new Money(amount);
        this._props.money = this._props.money.subtract(toSubtract);
    }

    /**
     * Removes up to the available balance without throwing errors.
     * @param {number} amount - Desired amount to remove.
     * @returns {number} The actual amount removed.
     */
    forceRemoveFunds(amount) {
        const desired = new Money(amount);
        const actualDeduction = this.money < desired.amount ? this._props.money : desired;
        
        this._props.money = this._props.money.subtract(actualDeduction);
        return actualDeduction.amount;
    }

    /**
     * Declares bankruptcy, resetting money and increasing debt.
     * @param {number} bankruptCount - Historical bankruptcies multiplier.
     * @throws {Error} If user still has money.
     */
    declareBankruptcy(bankruptCount) {
        if (this.money > 0) {
            throw new Error(`Cannot declare bankruptcy. Wallet still has ${this.money}€.`);
        }

        const baseMoney = GAME_CONFIG.ECONOMY.BANKRUPT_BASE_MONEY;
        const penaltyMultiplier = GAME_CONFIG.ECONOMY.BANKRUPT_PENALTY_MULT;
        const randomPenalty = Math.floor(Math.random() * bankruptCount * penaltyMultiplier);

        this._props.money = new Money(baseMoney);
        
        const addedDebt = new Money(baseMoney + randomPenalty);
        this._props.debt = this._props.debt.add(addedDebt);
    }

    /**
     * Serializes the entity back to a plain Database Object.
     * @returns {import('../../core/types.js').WalletProps}
     */
    toJSON() {
        return {
            name: this.name,
            money: this.money,
            debt: this.debt
        };
    }
}