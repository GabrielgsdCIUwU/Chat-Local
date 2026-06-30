import { Entity } from '../../core/domain/Entity.js';
import { RPG_CONFIG } from '../../core/rpgConfig.js';

/**
 * @typedef {Object} ActiveExpeditionProps
 * @property {string} zoneId - Expedition zone identification key.
 * @property {number} endTime - Milliseconds epoch timestamp indicating when the expedition ends.
 */

/**
 * @typedef {Object} JobProfileProps
 * @property {string} name - Username of the worker.
 * @property {string|null} job - Specialized job key (e.g., 'minero', 'leñador', 'pescador').
 * @property {number} toolLevel - Current tier level of the workspace tool.
 * @property {number} lastWork - Epoch timestamp of the last work execution.
 * @property {Object.<string, number>} activeBuffs - Active temporary potion enhancements mapped to expiration times.
 * @property {number} prestigeLevel - The accumulated prestige tier.
 * @property {ActiveExpeditionProps|null} activeExpedition - Progress markers for running passive expeditions.
 */


/**
 * Represents an RPG Job Profile domain entity.
 * Encapsulates all business rules regarding jobs, tool levels, cooldown validations, active buffs, and idle expeditions.
 * 
 * @extends {Entity<JobProfileProps>}
 */
export class JobProfile extends Entity {
    /**
     * @param {JobProfileProps} props - The initial properties of the job profile.
     */
    constructor(props) {
        super(props, props.name);
    }

    /** @returns {string} */
    get name() { return this._props.name; }

    /** @returns {string|null} */
    get job() { return this._props.job; }

    /** @returns {number} */
    get toolLevel() { return this._props.toolLevel; }

    /** @returns {number} */
    get lastWork() { return this._props.lastWork; }

    /** @returns {Object.<string, number>} */
    get activeBuffs() { return this._props.activeBuffs; }

    /** @returns {number} */
    get prestigeLevel() { return this._props.prestigeLevel || 0; }

    /** @returns {ActiveExpeditionProps|null} */
    get activeExpedition() { return this._props.activeExpedition; }

    /**
     * Assigns a job to this profile, resetting the tool level to 1.
     * @param {string} jobKey - The job key to join.
     * @throws {Error} If the user already has this job assigned.
     */
    changeJob(jobKey) {
        if (this._props.job === jobKey) {
            /** @type {string} */
            const jobName = RPG_CONFIG.JOBS?.[/**@type {keyof typeof RPG_CONFIG.JOBS} */ (jobKey)]?.name || jobKey;
            throw new Error(`Ya eres ${jobName}`);
        }
        this._props.job = jobKey;
        this._props.toolLevel = 1;
    }

    /**
     * Checks if a specific buff is currently active.
     * @param {string} buffId - The buff identifier.
     * @returns {boolean} True if active and not expired, false otherwise.
     */
    isBuffActive(buffId) {
        const expirationTime = this._props.activeBuffs?.[buffId];
        if (!expirationTime) return false;
        return Date.now() < expirationTime;
    }

    /**
     * Applies a new buff or refreshes an existing one.
     * @param {string} buffId - The buff identifier.
     * @param {number} durationMs - The duration of the buff in milliseconds.
     */
    applyBuff(buffId, durationMs) {
        if (!this._props.activeBuffs) {
            this._props.activeBuffs = {};
        }
        this._props.activeBuffs[buffId] = Date.now() + durationMs;
    }

    /**
     * Removes a specific buff immediately.
     * @param {string} buffId - The buff identifier to remove.
     * @returns {boolean} True if the buff was active and consumed, false otherwise.
     */
    removeBuff(buffId) {
        if (this._props.activeBuffs?.[buffId]) {
            const isActive = Date.now() < this._props.activeBuffs[buffId];
            delete this._props.activeBuffs[buffId];
            return isActive;
        }
        return false;
    }

    /**
     * Filters out expired buffs and returns active buffs with their remaining durations.
     * @returns {Object.<string, number>} Mapped remaining milliseconds.
     */
    cleanAndGetActiveBuffs() {
        /** @type {Object.<string, number>} */
        const active = {};
        const now = Date.now();
        if (!this._props.activeBuffs) {
            this._props.activeBuffs = {};
        }

        for (const [buffId, expirationTime] of Object.entries(this._props.activeBuffs)) {
            if (now > expirationTime) {
                delete this._props.activeBuffs[buffId];
            } else {
                active[buffId] = expirationTime - now;
            }
        }
        return active;
    }

    /**
     * Validates if the work cooldown has expired.
     * @param {number} petBonus - Percentage reduction of work cooldown from active companion.
     * @throws {Error} If the worker is still on cooldown.
     */
    verifyWorkCooldown(petBonus) {
        if (!this._props.job) {
            throw new Error("Aun no tienes oficio. Usa `/rpg join`");
        }
        const now = Date.now();
        let currentCooldownMs = RPG_CONFIG.WORK_COOLDOWN_MS;

        if (this.isBuffActive("haste")) {
            currentCooldownMs = Math.floor(currentCooldownMs / 2);
        } else if (this._props.activeBuffs?.["haste"]) {
            delete this._props.activeBuffs["haste"];
        }

        if (petBonus > 0) {
            currentCooldownMs -= Math.floor(currentCooldownMs * (petBonus / 100));
        }

        const timePassed = now - this._props.lastWork;
        if (timePassed < currentCooldownMs) {
            const totalSeconds = Math.ceil((currentCooldownMs - timePassed) / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            
            let timeString = "";
            if (minutes > 0) timeString += `${minutes} minuto(s) y `;
            timeString += `${seconds} segundo(s)`;

            throw new Error(`Estás cansado. Debes esperar ${timeString} para volver a trabajar.`);
        }
    }

    /**
     * Registers a successful work action.
     * @param {number} timestamp - Current epoch timestamp.
     */
    registerWork(timestamp) {
        this._props.lastWork = timestamp;
    }

    /**
     * Upgrades the workspace tool.
     * @param {number} maxLevel - The maximum tool level possible.
     * @throws {Error} If tool level is already at max.
     */
    upgradeTool(maxLevel) {
        if (this._props.toolLevel >= maxLevel) {
            throw new Error("Tu herramienta ya está al nivel máximo.");
        }
        this._props.toolLevel += 1;
    }

    /**
     * Resets the tool level and increments the prestige tier.
     */
    incrementPrestige() {
        this._props.toolLevel = 1;
        this._props.prestigeLevel = (this._props.prestigeLevel || 0) + 1;
    }

    /**
     * Initiates a passive expedition.
     * @param {string} zoneId - Expedition zone identification key.
     * @param {number} durationMs - Duration in milliseconds.
     * @throws {Error} If already on an expedition.
     */
    startExpedition(zoneId, durationMs) {
        if (this._props.activeExpedition) {
            throw new Error("Ya tienes una expedición en curso.");
        }
        this._props.activeExpedition = {
            zoneId,
            endTime: Date.now() + durationMs
        };
    }

    /**
     * Checks if the active expedition has completed.
     * @returns {boolean} True if expedition ended, false otherwise.
     */
    isExpeditionFinished() {
        if (!this._props.activeExpedition) return false;
        return Date.now() >= this._props.activeExpedition.endTime;
    }

    /**
     * Clears the active expedition reference.
     */
    clearExpedition() {
        this._props.activeExpedition = null;
    }

    /**
     * Plain data serialization.
     * @returns {JobProfileProps}
     */
    toJSON() {
        return {
            name: this.name,
            job: this.job,
            toolLevel: this.toolLevel,
            lastWork: this.lastWork,
            activeBuffs: { ...this.activeBuffs },
            prestigeLevel: this.prestigeLevel,
            activeExpedition: this.activeExpedition ? { ...this.activeExpedition } : null
        };
    }
}