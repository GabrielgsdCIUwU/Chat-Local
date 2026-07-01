import { ValueObject } from '../../core/domain/ValueObject.js';

/**
 * @typedef {Object} MoneyProps
 * @property {number} amount - Monetary balance.
 */

/**
 * Value Object representing a monetary currency value.
 * Enforces safe non-negative integer constraints.
 * 
 * @extends {ValueObject}
 */
export class Money extends ValueObject {
    /**
     * @param {number} amount - Safe non-negative integer.
     */
    constructor(amount) {
        if (!Number.isSafeInteger(amount) || amount < 0) {
            throw new Error("Money amount must be a safe, non-negative integer.");
        }
        super({ amount });
    }

    /**
     * Gets the current amount value.
     * @returns {number}
     */
    get amount() {
        return this._props.amount;
    }

    /**
     * Adds money to the current amount.
     * @param {Money} other - Money to add.
     * @returns {Money} New immutable Money instance.
     */
    add(other) {
        return new Money(this.amount + other.amount);
    }

    /**
     * Subtracts money from the current amount.
     * @param {Money} other - Money to subtract.
     * @returns {Money} New immutable Money instance.
     * @throws {Error} If results in negative balance.
     */
    subtract(other) {
        if (this.amount < other.amount) {
            throw new Error(`Fondos insuficientes. Disponible: ${this.amount}€, Pedido: ${other.amount}€.`);
        }
        return new Money(this.amount - other.amount);
    }

    /**
     * Multiplies money by a factor.
     * @param {number} factor - Multiplication factor.
     * @returns {Money} New immutable Money instance.
     */
    multiply(factor) {
        const result = Math.floor(this.amount * factor);
        return new Money(result);
    }
}