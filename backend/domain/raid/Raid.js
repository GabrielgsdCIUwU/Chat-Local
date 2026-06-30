import { Entity } from '../../core/domain/Entity.js';
import { DomainEventPublisher } from '../../core/domain/DomainEvents.js';
import { RaidDefeatedEvent } from './events/RaidDefeatedEvent.js';

/**
 * @typedef {Object} RaidProps
 * @property {number} maxHp - Total starting HP of the world boss.
 * @property {number} hp - Remaining HP of the world boss.
 * @property {Record<string, number>} damageLog - Map of player names to cumulative damage.
 * @property {number} expiresAt - Timestamp marking when the boss flees.
 * @property {boolean} active - Status flag of the combat session.
 */

/**
 * Domain Entity representing a live global Raid Event.
 * Encapsulates combat rules, logs damage, and publishes events upon victory.
 * 
 * @extends {Entity<RaidProps>}
 */
export class Raid extends Entity {
    /**
     * @param {RaidProps} props - The initial properties of the raid battle.
     * @param {string} [id] - The unique identifier of the raid.
     */
    constructor(props, id) {
        super(props, id);
    }

    /** @returns {number} */
    get hp() { return this._props.hp; }

    /** @returns {number} */
    get maxHp() { return this._props.maxHp; }

    /** @returns {Readonly<Record<string, number>>} */
    get damageLog() { return Object.freeze({ ...this._props.damageLog }); }

    /** @returns {number} */
    get expiresAt() { return this._props.expiresAt; }

    /** @returns {boolean} */
    get isActive() {
        return this._props.active && this._props.hp > 0 && Date.now() < this._props.expiresAt;
    }

    /**
     * Applies damage to the world boss.
     * Automatically triggers RaidDefeatedEvent when boss is slain.
     * 
     * @param {string} playerName - Attacking user name.
     * @param {number} rawDamage - Raw random damage to apply.
     * @returns {number} The actual clean damage registered.
     */
    hit(playerName, rawDamage) {
        if (!this.isActive) {
            throw new Error("Cannot attack an inactive or expired raid boss.");
        }

        const actualDamage = Math.min(this._props.hp, rawDamage);
        this._props.hp -= actualDamage;

        this._props.damageLog[playerName] = (this._props.damageLog[playerName] || 0) + actualDamage;

        if (this._props.hp <= 0) {
            this._props.active = false;
            
            DomainEventPublisher.publish(
                new RaidDefeatedEvent(this.id, this.damageLog)
            );
        }

        return actualDamage;
    }
}