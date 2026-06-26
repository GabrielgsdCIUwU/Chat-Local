/**
 * @template T
 * @typedef {Object} EntityProps
 */

/**
 * Base class for all Domain Entities.
 * Enforces identity and encapsulation.
 * 
 * @template T
 * @abstract
 */
export class Entity {
    /**
     * @protected
     * @type {string}
     */
    _id;

    /**
     * @protected
     * @type {T}
     */
    _props;

    /**
     * @param {T} props - The properties of the entity.
     * @param {string} [id] - The unique identifier. If not provided, a UUID should be generated.
     */
    constructor(props, id) {
        if (new.target === Entity) {
            throw new TypeError("Cannot construct Abstract instances directly");
        }
        this._id = id || crypto.randomUUID();
        this._props = props;
    }

    /**
     * Gets the unique identifier of the entity.
     * @returns {string}
     */
    get id() {
        return this._id;
    }

    /**
     * Compares this entity with another one by Identity (ID).
     * @param {Entity<T>} [object]
     * @returns {boolean}
     */
    equals(object) {
        if (object == null || object == undefined) {
            return false;
        }
        if (this === object) {
            return true;
        }
        if (!(object instanceof Entity)) {
            return false;
        }
        return this._id === object._id;
    }
}