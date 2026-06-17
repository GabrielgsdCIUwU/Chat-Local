import { RPG_CONFIG } from "../core/rpgConfig.js";

/**
 * @typedef {import('../repositories/JobRepository.js').JobProfile} JobProfile
 */

export class CraftingService {
    /**
     * 
     * @param {import('../repositories/InventoryRepository.js').InventoryRepository} inventoryRepository 
     * @param {import('../repositories/JobRepository.js').JobRepository} jobRepository 
     */
    constructor(inventoryRepository, jobRepository) {
        this.inventoryRepository = inventoryRepository;
        this.jobRepository = jobRepository;
    }

    /**
     * 
     * @param {import('../repositories/JobRepository.js').JobProfile[]} jobs 
     * @param {string} username 
     * @returns {import('../repositories/JobRepository.js').JobProfile}
     */
    #ensureJobProfile(jobs, username) {
        let profile = jobs.find(j => j.name === username);
        if (!profile) {
            profile = { name: username, job: null, toolLevel: 1, lastWork: 0, activeBuffs: {} };
            jobs.push(profile);
        }
        if (!profile.activeBuffs) profile.activeBuffs = {};
        return profile;
    }

    /**
     * 
     * @param {import('../repositories/InventoryRepository.js').UserInventory[]} inventories 
     * @param {string} username 
     * @returns {import('../repositories/InventoryRepository.js').UserInventory}
     */
    #ensureInventory(inventories, username) {
        let inventory = inventories.find(i => i.name === username);
        if (!inventory) {
            inventory = { name: username, items: {} };
        }
        return inventory;
    }

    /**
     * Crafts a recipe, consumes materials, and applies the buff to the user.
     * @param {string} username - The user executing the craft.
     * @param {string} recipeKey - The ID of the recipe from RPG_CONFIG.
     * @returns {Promise<Object>} The recipe configuration that was successfully crafted.
     * @throws {Error} If recipe doesn't exist or insufficient materials.
     */
    async craftItem(username, recipeKey) {
        const recipeKeyLowerCase = recipeKey.toLowerCase();
        /**
         * @type {import("../core/rpgConfig.js").CraftingRecipe}
         */
        const recipe = RPG_CONFIG.CRAFTING_RECIPES[recipeKeyLowerCase];

        if (!recipe) {
            throw new Error(`La receta "${recipeKey}" no existe. Usa \`/rpg recipes\` para cer la lista.`);
        }

        const inventory = await this.inventoryRepository.getInventory(username);
        for (const [reqItem, reqAmount] of Object.entries(recipe.cost)) {
            const userAmount = inventory.items[reqItem] || 0;
            if (userAmount < reqAmount) {
                throw new Error(`Materiales insuficientes. Necesitas ${reqAmount}x ${reqItem} (Tienes ${userAmount})`);
            }
        }

        await this.inventoryRepository.executeTransaction((inventories) => {
            const inventory = this.#ensureInventory(inventories, username);
            for (const [reqItem, reqAmount] of Object.entries(recipe.cost)) {
                inventory.items[reqItem] -= reqAmount;
                if (inventory.items[reqItem] <= 0) delete inventory.items[reqItem];
            }
        });

        await this.jobRepository.executeTransaction((jobs) => {
            const profile = this.#ensureJobProfile(jobs, username);
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
        let activeBuffsInfo = {};
        const now = Date.now();

        await this.jobRepository.executeTransaction((jobs) => {
            const profile = this.#ensureJobProfile(jobs, username);
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
}