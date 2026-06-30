import { RPG_CONFIG } from "../core/rpgConfig.js";

export class RPGService {
    /**
     * @param {import('../core/types.js').IEconomyService} economyService 
     * @param {import('../core/types.js').IInventoryRepository} inventoryRepository 
     * @param {import('../core/types.js').IJobRepository} jobRepository 
     * @param {import('../core/types.js').IPetService} petService 
     */
    constructor(economyService, inventoryRepository, jobRepository, petService) {
        this.economy = economyService;
        this.inventoryRepo = inventoryRepository;
        this.jobRepo = jobRepository;
        this.petService = petService;
    }

    /**
     * Assigns a profession to a user.
     *
     * If the user already has the specified profession, the operation fails.
     * Changing profession resets the user's tool level back to level 1.
     *
     * @param {string} username - Username of the player joining a profession.
     * @param {string} jobKey - Profession identifier to join.
     * @returns {Promise<string>} The display name of the assigned profession.
     * @throws {Error} If the specified profession does not exist.
     * @throws {Error} If the user already belongs to the specified profession.
     */
    async joinJob(username, jobKey) {
        const jobKeyLowerCase = /** @type {keyof typeof RPG_CONFIG.JOBS} */ (jobKey.toLowerCase());
        if (!RPG_CONFIG.JOBS[jobKeyLowerCase]) {
            throw new Error(`El oficio ${jobKey} no existe. Usa: minero, leñador o pescador`);
        }

        await this.jobRepo.executeTransaction((jobs) => {
            const profile = this.jobRepo.ensureJobProfile(jobs, username);
            profile.changeJob(jobKeyLowerCase);
        });

        return RPG_CONFIG.JOBS[jobKeyLowerCase].name
    }

    /**
     * Performs a work action for the user's current profession.
     *
     * The user's profession and cooldown are validated before generating
     * materials based on the configured loot table and tool level.
     * Generated items are automatically stored in the user's inventory.
     *
     * If no item is obtained through random chance, the first loot table
     * entry is granted as a guaranteed reward.
     *
     * @param {string} username - Username of the player performing the work action.
     * @returns {Promise<{actionText: string, items: Record<string, number>}>} An object containing the generated action text and the obtained items.
     * @throws {Error} If the user has not joined a profession.
     * @throws {Error} If the work cooldown has not yet expired.
     */
    async work(username) {
        /** @type {import("../core/types.js").JobProfile} */
        let profileInfo;
        const now = Date.now();

        const petBonus = await this.petService.getBonus(username, "WORK_COOLDOWN");

        await this.jobRepo.executeTransaction((jobs) => {
            const profile = this.jobRepo.ensureJobProfile(jobs, username);
            profile.verifyWorkCooldown(petBonus);
            profile.registerWork(now);
            profileInfo = profile;
        });

        // @ts-ignore
        if (!profileInfo?.job) throw new Error("Aun no tienes oficio. Usa `/rpg join`");
        const jobConfig = RPG_CONFIG.JOBS[/** @type {keyof typeof RPG_CONFIG.JOBS} */ (profileInfo.job)];
        const toolConfig = jobConfig.tools[/** @type {keyof typeof jobConfig.tools} */ (profileInfo.toolLevel)];
        const prestigeBonus = profileInfo.prestigeLevel || 0;
        const obtainedItems = /** @type {Record<string, number>} */ ({});

        for (const drop of toolConfig.lootTable) {
            if (Math.random() <= drop.chance) {
                const amount = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;
                obtainedItems[drop.item] = amount + prestigeBonus; 
            }
        }

        if (Object.keys(obtainedItems).length === 0) {
            const guaranteed = toolConfig.lootTable[0];
            obtainedItems[guaranteed.item] = guaranteed.min + prestigeBonus;
        }

        await this.inventoryRepo.executeTransaction((inventories) => {
            const inv = this.inventoryRepo.ensureInventory(inventories, username);
            for (const [item, amount] of Object.entries(obtainedItems)) {
                inv.addItem(item, amount);
            }
        });

        return {
            actionText: `${jobConfig.emoji} **${username}** ${jobConfig.actionText} con su **${toolConfig.name}**`,
            items: obtainedItems
        };
    }

    /**
     * Upgrades the user's current profession tool.
     *
     * The upgrade requires both money and materials defined in the next
     * tool level configuration. The required resources are removed and
     * the tool level is increased upon successful completion.
     *
     * @param {string} username - Username of the player upgrading their tool.
     * @returns {Promise<string>} The name of the newly unlocked tool.
     * @throws {Error} If the user has no profession assigned.
     * @throws {Error} If the current tool is already at the maximum level.
     * @throws {Error} If the user lacks the required money.
     * @throws {Error} If the user lacks the required materials.
     */
    async upgradeTool(username) {
        const profile = await this.jobRepo.getProfile(username);
        if (!profile?.job) throw new Error("No tienes oficio para mejorar herramientas.");

        /**
         * @type {import("../core/rpgConfig.js").JobConfig}
         */
        const jobConfig = RPG_CONFIG.JOBS[/** @type {keyof typeof RPG_CONFIG.JOBS} */ (profile.job)];
        const currentLevel = profile.toolLevel;
        const nextLevel = currentLevel + 1;
        /**
         * @type {import("../core/rpgConfig.js").ToolConfig}
         */
        const nextToolConfig = jobConfig.tools[nextLevel];

        if (!nextToolConfig) throw new Error("Tu herramienta ya está al nivel máximo.");

        const costMoney = nextToolConfig.upgradeCost.money;
        const costItems = nextToolConfig.upgradeCost.items;

        const wallet = await this.economy.getBalance(username);
        if (wallet.money < costMoney) throw new Error(`Te faltan ${costMoney - wallet.money}€ para mejorar esto.`);

        const inventory = await this.inventoryRepo.getInventory(username);
        for (const [reqItem, reqAmount] of Object.entries(costItems)) {
            const userAmount = inventory.items[reqItem] || 0;
            if (userAmount < reqAmount) {
                throw new Error(`Te faltan materiales. Necesitas ${reqAmount}x ${reqItem} (Tienes ${userAmount}).`);
            }
        }

        await this.economy.removeFunds(username, costMoney);

        await this.inventoryRepo.executeTransaction((inventories) => {
            const inventory = this.inventoryRepo.ensureInventory(inventories, username);
            for (const [reqItem, reqAmount] of Object.entries(costItems)) {
                inventory.removeItem(reqItem, reqAmount);
            }
        });

        await this.jobRepo.executeTransaction((jobs) => {
            const profile = this.jobRepo.ensureJobProfile(jobs, username);
            const maxLevel = Object.keys(jobConfig.tools).length;
            profile.upgradeTool(maxLevel);
        });

        return nextToolConfig.name;
    }

    /**
     * Sells items from the user's inventory to the market.
     *
     * The specified amount of items is removed from the inventory and the
     * corresponding market value is credited to the user's wallet.
     * Debt repayment rules from the economy system may reduce the final
     * credited earnings.
     *
     * @param {string} username - Username of the seller.
     * @param {string} itemName - Name of the item to sell.
     * @param {number} amount - Positive integer quantity to sell.
     * @returns {Promise<{itemName: string, totalValue: number}>} The normalized item name and the actual amount credited.
     * @throws {Error} If the amount is not a positive safe integer.
     * @throws {Error} If the item does not exist or cannot be sold.
     * @throws {Error} If the user does not own enough units of the item.
     */
    async sellItem(username, itemName, amount) {
        if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Cantidad no válida.");

        const actualItemName = /** @type {import("../core/rpgConfig.js").MarketItem} */ (Object.keys(RPG_CONFIG.MARKET_PRICES).find(k => k.toLowerCase() === itemName.toLowerCase()));
        if (!actualItemName) throw new Error(`El ítem "${itemName}" no existe o no se puede vender.`);

        const pricePerUnit = RPG_CONFIG.MARKET_PRICES[actualItemName];
        const totalValue = pricePerUnit * amount;

        await this.inventoryRepo.executeTransaction((inventories) => {
            const inventory = this.inventoryRepo.ensureInventory(inventories, username);
            if (!inventory.hasItem(actualItemName, amount)) {
                throw new Error(`No tienes suficientes. Tienes ${inventory.getItemAmount(actualItemName)}x ${actualItemName}.`);
            }
            inventory.removeItem(actualItemName, amount);
        });

        const actualEarnings = await this.economy.addFunds(username, totalValue);
        return { itemName: actualItemName, totalValue: actualEarnings };
    }

    /**
     * Retrieves the complete RPG profile for a user.
     *
     * Returns both the profession profile and inventory information
     * used by the RPG system.
     *
     * @param {string} username - Username whose RPG profile should be retrieved.
     * @returns {Promise<{
     *   profile: import('../core/types.js').JobProfile | null,
     *   inventory: import('../core/types.js').UserInventory
     * }>} The user's profession profile and inventory data.
     */
    async getFullProfile(username) {
        const profile = await this.jobRepo.getProfile(username);
        if (!profile) throw new Error("No existe este usuario");
        const inventory = await this.inventoryRepo.getInventory(username);
        return { profile, inventory };
    }

    /**
     * Resets the player's progress in exchange for a Prestige Level.
     * @param {string} username - The user executing prestige.
     * @returns {Promise<number>} The new prestige level.
     * @throws {Error} If tool is not maxed out.
     */
    async executePrestige(username) {
        const profile = await this.jobRepo.getProfile(username);
        if (!profile?.job) throw new Error("No tienes un trabajo");

        const jobConfig = RPG_CONFIG.JOBS[/** @type {keyof typeof RPG_CONFIG.JOBS}*/(profile.job)];
        const maxToolLevel = Object.keys(jobConfig.tools).length;

        if (profile.toolLevel < maxToolLevel) {
            throw new Error(`Debes mejorar tu herramienta al máximo nivel (${maxToolLevel}) primero.`);
        }

        const wallet = await this.economy.getBalance(username);
        if (wallet.money > 0) {
            await this.economy.removeFunds(username, wallet.money);
        }

        await this.inventoryRepo.executeTransaction((inventories) => {
            const inventory = this.inventoryRepo.ensureInventory(inventories, username);
            inventory.clear();
        });

        let newPrestigeLevel = 1;
        await this.jobRepo.executeTransaction((jobs) => {
            const profile = this.jobRepo.ensureJobProfile(jobs, username);
            profile.incrementPrestige();
            newPrestigeLevel = profile.prestigeLevel;
        });

        return newPrestigeLevel;
    }


    /**
     * Start an indle expedition.
     * @param {string} username 
     * @param {string} zoneKey 
     * @returns {Promise<Object>}
     */
    async startExpedition(username, zoneKey) {
        const zoneKeyLower = zoneKey.toLowerCase();
        const expeditionConfig = RPG_CONFIG.EXPEDITIONS[/** @type {keyof typeof RPG_CONFIG.EXPEDITIONS} */ (zoneKeyLower)];
        if (!expeditionConfig) throw new Error("La zona de expedición no existe.");

        await this.jobRepo.executeTransaction((jobs) => {
            const profile = this.jobRepo.ensureJobProfile(jobs, username);
            
            if (profile.activeExpedition) {
                throw new Error("Ya tienes una expedición en curso.");
            }
        });

        await this.economy.removeFunds(username, expeditionConfig.cost);

        await this.jobRepo.executeTransaction((jobs) => {
            const profile = this.jobRepo.ensureJobProfile(jobs, username);
            profile.startExpedition(zoneKeyLower, expeditionConfig.durationMs);
        });

        return expeditionConfig;
    }

    /**
     * Claim expeditions when ended.
     * @returns {Promise<Array<{username:string, zoneName:string, loot:Record<string, number>}>>} Loot notifications
     */
    async processFinishedExpeditions() {
        const now = Date.now();
        const notifications = /** @type {Array<{username:string, zoneName:string, loot:Record<string, number>}>} */ ([]);
        const rewardsToDistribute = /** @type {Array<{username:string, zoneName:string, loot:Record<string, number>}>} */ ([]);

        await this.jobRepo.executeTransaction((jobs) => {
            for (const profile of /** @type {import('../core/types.js').JobProfile[]} */ (jobs)) {
                
                if (profile.activeExpedition && profile.isExpeditionFinished()) {
                    const config = RPG_CONFIG.EXPEDITIONS[/** @type {keyof typeof RPG_CONFIG.EXPEDITIONS} */ (profile.activeExpedition.zoneId)];
                    
                    const obtainedItems = /** @type {Record<string, number>} */ ({});
                    for (const drop of config.lootTable) {
                        const amount = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;
                        obtainedItems[drop.item] = amount;
                    }

                    rewardsToDistribute.push({
                        username: profile.name,
                        zoneName: config.name,
                        loot: obtainedItems
                    });

                    profile.clearExpedition();
                }
            }
        });

        if (rewardsToDistribute.length > 0) {
            await this.inventoryRepo.executeTransaction((inventories) => {
                for (const reward of rewardsToDistribute) {
                    const inv = this.inventoryRepo.ensureInventory(inventories, reward.username);
                    
                    for (const [item, amount] of Object.entries(reward.loot)) {
                        inv.addItem(item, amount);
                    }
                    
                    notifications.push(reward);
                }
            });
        }

        return notifications;
    }
}