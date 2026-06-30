import { RPG_CONFIG } from "../core/rpgConfig.js";

/**
 * @typedef {import('../core/types.js').ICraftingService} ICraftingService 
 * @typedef {import('../core/types.js').IInventoryRepository} IInventoryRepository 
 * @typedef {import('../core/types.js').IJobRepository} IJobRepository 
 */

export class CraftingService {
    /**
     * 
     * @param {IInventoryRepository} inventoryRepository 
     * @param {IJobRepository} jobRepository  
     */
    constructor(inventoryRepository, jobRepository) {
        this.inventoryRepository = inventoryRepository;
        this.jobRepository = jobRepository;
    }

    /**
     * Crafts a recipe, consumes materials, and applies the buff to the user.
     * @param {string} username - The user executing the craft.
     * @param {string} recipeKey - The ID of the recipe from RPG_CONFIG.
     * @returns {Promise<Object>} The recipe configuration that was successfully crafted.
     * @throws {Error} If recipe doesn't exist or insufficient materials.
     */
    async craftItem(username, recipeKey) {
        const recipeKeyLowerCase = /** @type {keyof typeof RPG_CONFIG.CRAFTING_RECIPES} */ (recipeKey.toLowerCase());        
        const recipe = RPG_CONFIG.CRAFTING_RECIPES[recipeKeyLowerCase];

        if (!recipe) {
            throw new Error(`La receta "${recipeKey}" no existe. Usa \`/rpg recipes\` para cer la lista.`);
        }

        const inventory = await this.inventoryRepository.getInventory(username);
        for (const [reqItem, reqAmount] of Object.entries(recipe.cost)) {
            if (!inventory.hasItem(reqItem, reqAmount)) {
                throw new Error(`Materiales insuficientes. Necesitas ${reqAmount}x ${reqItem} (Tienes ${inventory.items[reqItem] || 0})`);
            }
        }

        await this.inventoryRepository.executeTransaction((inventories) => {
            const txInventory = this.inventoryRepository.ensureInventory(inventories, username);
            for (const [reqItem, reqAmount] of Object.entries(recipe.cost)) {
                txInventory.removeItem(reqItem, reqAmount);
            }
        });

        await this.jobRepository.executeTransaction((jobs) => {
            const profile = this.jobRepository.ensureJobProfile(jobs, username);
            const expirationTime = Date.now() + recipe.durationMs;

            profile.activeBuffs[recipe.buffId] = expirationTime;
        });

        return recipe;
    }

    /**
     * Retrieves the list of currently active buffs for a user.
     * Automatically cleans up expired buffs.
     * @param {string} username - The user to check.
     * @returns {Promise<Object.<string, number>>} Map of active buffs and their remaining milliseconds.
     */
    async getActiveBuffs(username) {
        /** @type {{[key: string]: number}} */
        let activeBuffsInfo = {};
        const now = Date.now();

        await this.jobRepository.executeTransaction((jobs) => {
            const profile = this.jobRepository.ensureJobProfile(jobs, username);
            let hasChanges = false;

            for (const [buffId, expirationTime] of Object.entries(profile.activeBuffs)) {
                if (now > expirationTime) {
                    delete profile.activeBuffs[buffId];
                    hasChanges = true;
                } else {
                    activeBuffsInfo[buffId] = expirationTime - now;
                }
            }
            return hasChanges ? jobs : undefined;
        });

        return activeBuffsInfo
    }

    /**
     * Consumes (removes) a specific buff from a user if it is currently active.
     * @param {string} username - The user to check.
     * @param {string} buffId - The ID of the buff to consume (e.g., "anti_rob").
     * @returns {Promise<boolean>} True if the buff was active and consumed, false otherwise.
     */
    async consumeBuff(username, buffId) {
        let wasConsumed = false;
        const now = Date.now();

        await this.jobRepository.executeTransaction((jobs) => {
            const profile = jobs.find(j => j.name === username);
            if (profile?.activeBuffs?.[buffId]) {
                if (now < profile.activeBuffs[buffId]) {
                    wasConsumed = true;
                }
                delete profile.activeBuffs[buffId];
                return jobs;
            }
        });

        return wasConsumed;
    }
}