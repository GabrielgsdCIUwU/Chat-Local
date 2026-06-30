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

    /** @returns {string} */
    get name() { return this._props.name; }

    /** @returns {Object.<string, number>} */
    get items() { return this._props.items; }

    /**
     * Finds the exact item name key in the inventory, ignoring case.
     * @param {string} itemName - The name of the item.
     * @returns {string|undefined} The matched exact key, or undefined if not found.
     */
    findItemKey(itemName) {
        return Object.keys(this._props.items).find(k => k.toLowerCase() === itemName.toLowerCase());
    }

    /**
     * Gets the current amount of a specific item, ignoring case.
     * @param {string} itemName - The name of the item.
     * @returns {number} The current quantity.
     */
    getItemAmount(itemName) {
        const key = this.findItemKey(itemName);
        return key ? (this._props.items[key] || 0) : 0;
    }

    /**
     * Checks if the inventory contains at least a specific amount of an item (case-insensitive).
     * @param {string} itemName - The name of the item to check.
     * @param {number} amount - The minimum required quantity.
     * @returns {boolean} True if the inventory has enough items, false otherwise.
     */
    hasItem(itemName, amount) {
        return this.getItemAmount(itemName) >= amount;
    }

    /**
     * Adds a specific amount of an item to the inventory.
     * @param {string} itemName - The name of the item to add.
     * @param {number} amount - The quantity to add.
     */
    addItem(itemName, amount) {
        if (amount <= 0) return;
        const key = this.findItemKey(itemName) || itemName;
        this._props.items[key] = (this._props.items[key] || 0) + amount;
    }

    /**
     * Removes a specific amount of an item (case-insensitive).
     * Automatically cleans up the key if the quantity reaches 0.
     * @param {string} itemName - The name of the item to remove.
     * @param {number} amount - The quantity to deduct.
     * @throws {Error} If user doesn't have enough items.
     */
    removeItem(itemName, amount) {
        if (amount <= 0) return;
        const key = this.findItemKey(itemName);
        if (!key) throw new Error("No se ha encontrado un item: " + itemName)
        const currentAmount = key ? this._props.items[key] : 0;

        if (currentAmount < amount) {
            throw new Error(`No tienes suficientes. Tienes ${currentAmount}x ${itemName}.`);
        }

        this._props.items[key] -= amount;

        if (this._props.items[key] === 0) {
            delete this._props.items[key];
        }
    }

    /**
     * Clears all items from the inventory.
     */
    clear() {
        this._props.items = {};
    }

    /**
     * Serializes the entity to a plain database object.
     * @returns {InventoryProps}
     */
    toJSON() {
        return {
            name: this.name,
            items: { ...this.items }
        };
    }
}