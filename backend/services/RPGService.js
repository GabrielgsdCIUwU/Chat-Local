import { RPG_CONFIG } from "../core/rpgConfig.js";

export class RPGService {
    /**
     * @param {import('./EconomyService.js').EconomyService} economyService 
     * @param {import('../repositories/InventoryRepository.js').InventoryRepository} inventoryRepository 
     * @param {import('../repositories/JobRepository.js').JobRepository} jobRepository 
     * @param {import('./PetService.js').PetService} petService 
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
        const jobKeyLowerCase = jobKey.toLowerCase();
        if (!RPG_CONFIG.JOBS[jobKeyLowerCase]) {
            throw new Error(`El oficio ${jobKey} no existe. Usa: minero, leñador o pescador`);
        }

        await this.jobRepo.executeTransaction((jobs) => {
            const profile = this.jobRepo.ensureJobProfile(jobs, username);
            if (profile.job === jobKeyLowerCase) {
                throw new Error(`Ya eres ${RPG_CONFIG.JOBS[jobKeyLowerCase].name}`);
            }
            profile.job = jobKeyLowerCase;
            profile.toolLevel = 1;
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
        let profileInfo;
        const now = Date.now();

        const petBonus = await this.petService.getBonus(username, "WORK_COOLDOWN");

        await this.jobRepo.executeTransaction((jobs) => {
            const profile = this.jobRepo.ensureJobProfile(jobs, username);
            if (!profile.job) throw new Error("Aun no tienes oficio. Usa `/rpg join`");

            let currentCooldownMs = RPG_CONFIG.WORK_COOLDOWN_MS;
            if (profile.activeBuffs?.["haste"]) {
                if (now < profile.activeBuffs["haste"]) {
                    currentCooldownMs = Math.floor(currentCooldownMs / 2);
                } else {
                    delete profile.activeBuffs["haste"];
                }
            }

            if (petBonus > 0) {
                currentCooldownMs -= Math.floor(currentCooldownMs * (petBonus / 100));
            }

            const timePassed = now - profile.lastWork;
            if (timePassed < currentCooldownMs) {
                const totalSeconds = Math.ceil((currentCooldownMs - timePassed) / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                
                let timeString = "";
                if (minutes > 0) timeString += `${minutes} minuto(s) y `;
                timeString += `${seconds} segundo(s)`;

                throw new Error(`Estás cansado. Debes esperar ${timeString} para volver a trabajar.`);
            }

            profile.lastWork = now;
            profileInfo = { ...profile };
        });

        const jobConfig = RPG_CONFIG.JOBS[profileInfo.job];
        const toolConfig = jobConfig.tools[profileInfo.toolLevel];
        const prestigeBonus = profileInfo.prestigeLevel || 0;
        const obtainedItems = {};

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
                inv.items[item] = (inv.items[item] || 0) + amount;
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
        const jobConfig = RPG_CONFIG.JOBS[profile.job];
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
                inventory.items[reqItem] -= reqAmount;
                if (inventory.items[reqItem] === 0) delete inventory.items[reqItem];
            }
        });

        await this.jobRepo.executeTransaction((jobs) => {
            const profile = this.jobRepo.ensureJobProfile(jobs, username);
            profile.toolLevel = nextLevel;
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

        /**
         * @type {import("../core/rpgConfig.js").MarketItem}
         */
        const actualItemName = Object.keys(RPG_CONFIG.MARKET_PRICES).find(k => k.toLowerCase() === itemName.toLowerCase());
        if (!actualItemName) throw new Error(`El ítem "${itemName}" no existe o no se puede vender.`);

        const pricePerUnit = RPG_CONFIG.MARKET_PRICES[actualItemName];
        const totalValue = pricePerUnit * amount;

        await this.inventoryRepo.executeTransaction((inventories) => {
            const inventory = this.inventoryRepo.ensureInventory(inventories, username);
            const userAmount = inventory.items[actualItemName] || 0;

            if (userAmount < amount) {
                throw new Error(`No tienes suficientes. Tienes ${userAmount}x ${actualItemName}.`);
            }

            inventory.items[actualItemName] -= amount;
            if (inventory.items[actualItemName] === 0) delete inventory.items[actualItemName];
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
     *   profile: import('../repositories/JobRepository.js').JobProfile | null,
     *   inventory: import('../repositories/InventoryRepository.js').UserInventory
     * }>} The user's profession profile and inventory data.
     */
    async getFullProfile(username) {
        const profile = await this.jobRepo.getProfile(username);
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

        const jobConfig = RPG_CONFIG.JOBS[profile.job];
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
            inventory.items = {};
        });

        let newPrestigeLevel = 1;
        await this.jobRepo.executeTransaction((jobs) => {
            const profile = this.jobRepo.ensureJobProfile(jobs, username);
            profile.toolLevel = 1;
            profile.prestigeLevel = (profile.prestigeLevel || 0) + 1;
            newPrestigeLevel = profile.prestigeLevel;
        });

        return newPrestigeLevel;
    }


    /**
     * Start an indle expedition.
     * @param {string} username 
     * @param {string} zoneKey 
     * @returns {Object}
     */
    async startExpedition(username, zoneKey) {
        const zoneKeyLower = zoneKey.toLowerCase();
        const expeditionConfig = RPG_CONFIG.EXPEDITIONS[zoneKeyLower];
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
            profile.activeExpedition = {
                zoneId: zoneKeyLower,
                endTime: Date.now() + expeditionConfig.durationMs
            };
        });

        return expeditionConfig;
    }

    /**
     * Claim expeditions when ended
     * @returns {Promise<Array>} Loot notifications
     */
    async processFinishedExpeditions() {
        const now = Date.now();
        const notifications = [];
        const rewardsToDistribute = [];

        await this.jobRepo.executeTransaction((jobs) => {
            for (const profile of jobs) {
                
                if (profile.activeExpedition && now >= profile.activeExpedition.endTime) {
                    const config = RPG_CONFIG.EXPEDITIONS[profile.activeExpedition.zoneId];
                    
                    const obtainedItems = {};
                    for (const drop of config.lootTable) {
                        const amount = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;
                        obtainedItems[drop.item] = amount;
                    }

                    rewardsToDistribute.push({
                        username: profile.name,
                        zoneName: config.name,
                        loot: obtainedItems
                    });

                    profile.activeExpedition = null;
                }
            }
        });

        if (rewardsToDistribute.length > 0) {
            await this.inventoryRepo.executeTransaction((inventories) => {
                for (const reward of rewardsToDistribute) {
                    const inv = this.inventoryRepo.ensureInventory(inventories, reward.username);
                    
                    for (const [item, amount] of Object.entries(reward.loot)) {
                        inv.items[item] = (inv.items[item] || 0) + amount;
                    }
                    
                    notifications.push(reward);
                }
            });
        }

        return notifications;
    }
}