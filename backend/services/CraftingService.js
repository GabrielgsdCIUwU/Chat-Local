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
            throw new Error(`La receta "${recipeKey}" no existe. Usa \`/rpg recipes\` para ver la lista.`);
        }

        const inventory = await this.inventoryRepository.getInventory(username);
        for (const [reqItem, reqAmount] of Object.entries(recipe.cost)) {
            if (!inventory.hasItem(reqItem, reqAmount)) {
                throw new Error(`Materiales insuficientes. Necesitas ${reqAmount}x ${reqItem} (Tienes ${inventory.getItemAmount(reqItem)}).`);
            }
        }

        await this.inventoryRepository.updateTransactional(username, (txInventory) => {
            for (const [reqItem, reqAmount] of Object.entries(recipe.cost)) {
                txInventory.removeItem(reqItem, reqAmount);
            }
        });


        await this.jobRepository.updateTransactional(username, (profile) => {
            profile.applyBuff(recipe.buffId, recipe.durationMs);
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

         await this.jobRepository.updateTransactional(username, (profile) => {
            activeBuffsInfo = profile.cleanAndGetActiveBuffs();
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

        await this.jobRepository.updateTransactional(username, (profile) => {
            wasConsumed = profile.removeBuff(buffId);
        });

        return wasConsumed;
    }
}