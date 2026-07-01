import { IDomainEvent } from '../../../core/domain/DomainEvents.js';

/**
 * Domain Event published immediately when a global world boss is defeated.
 * 
 * @extends {IDomainEvent}
 */
export class RaidDefeatedEvent extends IDomainEvent {
    /**
     * @param {string} raidId - Unique combat ID.
     * @param {Record<string, number>} damageLog - Copy of the final registered damage log.
     */
    constructor(raidId, damageLog) {
        super();
        /**
         * @type {string}
         * @readonly
         */
        this.raidId = raidId;
        /**
         * @type {Record<string, number>}
         * @readonly
         */
        this.damageLog = damageLog;
    }
}