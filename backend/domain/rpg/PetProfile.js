import { Entity } from '../../core/domain/Entity.js';

/**
 * @typedef {Object} PetInstance
 * @property {string} id - Unique UUID of the companion.
 * @property {string} type - Configuration key from RPG configs.
 */

/**
 * @typedef {Object} PetProfileProps
 * @property {string} name - Username of the owner.
 * @property {number} eggs - Quantity of unhatched eggs.
 * @property {PetInstance[]} pets - List of obtained companions.
 * @property {string|null} equipped - Instance ID of the active companion.
 */

/**
 * Represents a user's Pet Companion Profile.
 * Encapsulates gacha egg accumulation, hatching, equipping, and releasing pets.
 * 
 * @extends {Entity<PetProfileProps>}
 */
export class PetProfile extends Entity {
    /**
     * @param {PetProfileProps} props 
     */
    constructor(props) {
        super(props, props.name);
    }

    /** @returns {string} */
    get name() { return this._props.name; }

    /** @returns {number} */
    get eggs() { return this._props.eggs; }

    /** @returns {PetInstance[]} */
    get pets() { return this._props.pets; }

    /** @returns {string|null} */
    get equipped() { return this._props.equipped; }

    /**
     * Increases the egg balance by a specific amount.
     * @param {number} amount - Quantity of eggs to buy.
     */
    buyEggs(amount) {
        if (amount <= 0) return;
        this._props.eggs += amount;
    }

    /**
     * Consumes one egg to hatch a new pet companion.
     * @param {string} petId - Unique generated ID for the new pet.
     * @param {string} petType - Rarity-rolled configuration key.
     * @throws {Error} If the profile has no eggs left.
     */
    hatchEgg(petId, petType) {
        if (this._props.eggs < 1) {
            throw new Error("No tienes huevos. Compra uno con `/pet buy`.");
        }
        this._props.eggs -= 1;
        this._props.pets.push({ id: petId, type: petType });
    }

    /**
     * Equips a pet companion by its unique ID, or unequips if "none" is provided.
     * @param {string} petId - Unique identifier of the target pet, or "none".
     * @throws {Error} If the pet is not owned by the user.
     */
    equipPet(petId) {
        if (petId.toLowerCase() === "none") {
            this._props.equipped = null;
            return;
        }

        const pet = this._props.pets.find(p => p.id.startsWith(petId));
        if (!pet) {
            throw new Error("No posees una mascota con ese ID.");
        }

        this._props.equipped = pet.id;
    }

    /**
     * Removes a companion from the collection.
     * @param {string} petId - Unique identifier of the companion to release.
     * @returns {PetInstance} The details of the released companion.
     * @throws {Error} If the pet is equipped or not owned.
     */
    releasePet(petId) {
        const index = this._props.pets.findIndex(p => p.id.startsWith(petId));
        if (index === -1) {
            throw new Error("No posees una mascota con ese ID.");
        }

        const petInstance = this._props.pets[index];
        if (this._props.equipped === petInstance.id) {
            throw new Error("No puedes liberar una mascota que tienes equipada. Desequípala usando '/pet equip none' primero.");
        }

        this._props.pets.splice(index, 1);
        return petInstance;
    }

    /**
     * Plain data serialization.
     * @returns {PetProfileProps}
     */
    toJSON() {
        return {
            name: this.name,
            eggs: this.eggs,
            pets: [ ...this.pets ],
            equipped: this.equipped
        };
    }
}