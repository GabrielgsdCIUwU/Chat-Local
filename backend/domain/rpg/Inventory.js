import { Entity } from '../../core/domain/Entity.js';

/**
 * @typedef {Object} InventoryProps
 * @property {string} name - Username owning the inventory.
 * @property {Object.<string, number>} items - Map of items and their quantities.
 */

/**
 * Represents a user's RPG Inventory.
 * Encapsulates the logic of adding, removing, and checking items.
 * 
 * @extends {Entity<InventoryProps>}
 */
export class Inventory extends Entity {
    /**
     * @param {InventoryProps} props 
     */
    constructor(props) {
        super(props, props.name);
    }

    get name() { return this._props.name; }
    get items() { return this._props.items; }

    /**
     * Checks if the inventory contains at least a specific amount of an item.
     * @param {string} itemName 
     * @param {number} amount 
     * @returns {boolean}
     */
    hasItem(itemName, amount) {
        return (this._props.items[itemName] || 0) >= amount;
    }

    /**
     * Adds a specific amount of an item to the inventory.
     * @param {string} itemName 
     * @param {number} amount 
     */
    addItem(itemName, amount) {
        if (amount <= 0) return;
        this._props.items[itemName] = (this._props.items[itemName] || 0) + amount;
    }

    /**
     * Removes a specific amount of an item. Throws error if insufficient.
     * Automatically cleans up the key if the quantity reaches 0.
     * @param {string} itemName 
     * @param {number} amount 
     * @throws {Error} If user doesn't have enough items.
     */
    removeItem(itemName, amount) {
        if (amount <= 0) return;
        if (!this.hasItem(itemName, amount)) {
            const current = this._props.items[itemName] || 0;
            throw new Error(`No tienes suficientes. Tienes ${current}x ${itemName}.`);
        }

        this._props.items[itemName] -= amount;

        if (this._props.items[itemName] === 0) {
            delete this._props.items[itemName];
        }
    }

    /**
     * Serializes the entity to a plain object.
     * @returns {InventoryProps}
     */
    toJSON() {
        return {
            name: this.name,
            items: { ...this.items }
        };
    }
}