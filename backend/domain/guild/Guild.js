import { Entity } from '../../core/domain/Entity.js';
import { GAME_CONFIG } from '../../core/constants.js';

/**
 * @typedef {Object} GuildMember
 * @property {string} name - Member's username.
 * @property {string} rank - Assigned guild authority tier ('Leader', 'Member').
 */

/**
 * @typedef {Object} GuildProps
 * @property {string} id - Unique identifier.
 * @property {string} name - Unique guild name.
 * @property {number} level - Current tier level.
 * @property {number} bankMoney - Safe funds deposited in the treasury.
 * @property {GuildMember[]} members - Array of joined members.
 */

/**
 * Represents a Player Guild/Clan domain entity.
 * Encapsulates member management, Rank validations, and treasury/level progression.
 * 
 * @extends {Entity<GuildProps>}
 */
export class Guild extends Entity {
    /**
     * @param {GuildProps} props 
     */
    constructor(props) {
        super(props, props.id);
    }

    /** @returns {string} */
    get id() { return this._props.id; }

    /** @returns {string} */
    get name() { return this._props.name; }

    /** @returns {number} */
    get level() { return this._props.level; }

    /** @returns {number} */
    get bankMoney() { return this._props.bankMoney; }

    /** @returns {GuildMember[]} */
    get members() { return this._props.members; }

    /**
     * Checks if a member has administrative privileges (Leader or Officer).
     * @param {string} username - Name of the member to audit.
     * @returns {boolean} True if authorized, false otherwise.
     */
    isLeaderOrOfficer(username) {
        const member = this._props.members.find(m => m.name === username);
        if (!member) return false;
        return member.rank === "Leader" || member.rank === "Officer";
    }

    /**
     * Registers a new member in the guild.
     * @param {string} username - Name of the new member.
     * @param {string} [rank="Member"] - The initial rank.
     * @throws {Error} If the user is already a member.
     */
    addMember(username, rank = "Member") {
        const exists = this._props.members.some(m => m.name === username);
        if (exists) {
            throw new Error("El usuario ya pertenece a este gremio.");
        }
        this._props.members.push({ name: username, rank });
    }

    /**
     * Deducts a member from the guild with checks for leader constraints.
     * @param {string} username - Name of the member leaving.
     * @throws {Error} If member not found or is leader and other members exist.
     */
    removeMember(username) {
        const index = this._props.members.findIndex(m => m.name === username);
        if (index === -1) {
            throw new Error("El usuario no pertenece a este gremio.");
        }

        const member = this._props.members[index];
        if (member.rank === "Leader" && this._props.members.length > 1) {
            throw new Error("Eres el líder. Debes nombrar otro líder antes de salir.");
        }

        this._props.members.splice(index, 1);
    }

    /**
     * Deposits money into the guild bank and evaluates automatic level-up bounds.
     * @param {number} amount - Positve amount of money to donate.
     * @returns {boolean} True if a level-up occurred, false otherwise.
     */
    donate(amount) {
        if (amount <= 0) return false;

        this._props.bankMoney += amount;
        let leveledUp = false;

        /**
         * @param {keyof typeof GAME_CONFIG.GUILD_LEVEL_COSTS} levelKey
         * @returns {number|undefined}
         */
        const getLevelCost = (levelKey) => GAME_CONFIG.GUILD_LEVEL_COSTS[levelKey];

        let nextLevelKey = /** @type {keyof typeof GAME_CONFIG.GUILD_LEVEL_COSTS} */ (this._props.level + 1);
        let nextLevelCost = getLevelCost(nextLevelKey);

        while (nextLevelCost && this._props.bankMoney >= nextLevelCost) {
            this._props.bankMoney -= nextLevelCost;
            this._props.level += 1;
            leveledUp = true;

            nextLevelKey = /** @type {keyof typeof GAME_CONFIG.GUILD_LEVEL_COSTS} */ (this._props.level + 1);
            // @ts-ignore
            nextLevelCost = getLevelCost(nextLevelKey);
        }

        return leveledUp;
    }

    /**
     * Plain data serialization.
     * @returns {GuildProps}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            level: this.level,
            bankMoney: this.bankMoney,
            members: [ ...this.members ]
        };
    }
}