/**
 * Base class for all Value Objects in the domain.
 * Enforces immutability and structural equality.
 * 
 * @abstract
 */
export class ValueObject {
    /**
     * @param {Record<string, any>} props - The immutable properties of the value object.
     */
    constructor(props) {
        /**
         * @protected
         * @type {Readonly<Record<string, any>>}
         */
        this._props = Object.freeze({ ...props });
    }

    /**
     * Compares structural equality with another Value Object.
     * @param {ValueObject} [vo] - The other value object to compare.
     * @returns {boolean} True if structural properties are identical.
     */
    equals(vo) {
        if (vo === null || vo === undefined) {
            return false;
        }
        if (vo.constructor !== this.constructor) {
            return false;
        }
        return JSON.stringify(this._props) === JSON.stringify(vo._props);
    }
}