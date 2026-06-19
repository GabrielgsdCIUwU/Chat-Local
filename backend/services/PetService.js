import crypto from "node:crypto";
import { RPG_CONFIG } from "../core/rpgConfig.js";

/**
 * @typedef {import('../core/rpgConfig.js').PetConfig} PetConfig
 */

export class PetService {
    /**
     * @param {import('../repositories/PetRepository.js').PetRepository} petRepository 
     * @param {import('./EconomyService.js').EconomyService} economyService 
     */
    constructor(petRepository, economyService) {
        this.petRepo = petRepository;
        this.economy = economyService;
    }

    /**
     * Purchases gacha eggs for the user.
     * @param {string} username - The buyer's username.
     * @param {number} [amount=1] - The number of eggs to buy.
     * @returns {Promise<number>} The total cost paid.
     * @throws {Error} If amount is invalid or funds are insufficient.
     */
    async buyEgg(username, amount = 1) {
        if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Cantidad inválida.");
        const totalCost = RPG_CONFIG.EGG_PRICE * amount;

        await this.economy.removeFunds(username, totalCost);

        await this.petRepo.executeTransaction((profiles) => {
            const profile = this.petRepo.ensureProfile(profiles, username);
            profile.eggs += amount;
        });

        return totalCost;
    }

    /**
     * Opens an egg and grants a random pet based on rarity probabilities.
     * @param {string} username - The user opening the egg.
     * @returns {Promise<PetConfig>} The configuration of the newly obtained pet.
     * @throws {Error} If the user has no eggs.
     */
    async openEgg(username) {
        let newPetType = null;
        let newPetId = crypto.randomUUID();

        await this.petRepo.executeTransaction((profiles) => {
            const profile = this.petRepo.ensureProfile(profiles, username);
            if (profile.eggs < 1) throw new Error("No tienes huevos. Compra uno con `/pet buy`.");
            
            profile.eggs -= 1;

            const roll = Math.random();
            let rarity = "COMMON";
            
            if (roll <= 0.05) rarity = "LEGENDARY";
            else if (roll <= 0.3) rarity = "EPIC";

            const availablePets = Object.entries(RPG_CONFIG.PETS).filter(([k, v]) => v.rarity === rarity);
            
            const chosenIndex = Math.floor(Math.random() * availablePets.length);
            newPetType = availablePets[chosenIndex][0];

            profile.pets.push({ id: newPetId, type: newPetType });
        });

        return RPG_CONFIG.PETS[newPetType];
    }

    /**
     * Equips a specific pet by its unique ID.
     * @param {string} username - The user equipping the pet.
     * @param {string} petId - The unique ID of the pet, or "none" to unequip.
     * @returns {Promise<PetConfig | null>} The equipped pet's configuration, or null if unequipped.
     * @throws {Error} If the pet ID is not owned by the user.
     */
    async equipPet(username, petId) {
        let equippedPet = null;

        await this.petRepo.executeTransaction((profiles) => {
            const profile = this.petRepo.ensureProfile(profiles, username);
            
            if (petId.toLowerCase() === "none") {
                profile.equipped = null;
                return;
            }

            const petExists = profile.pets.find(p => p.id === petId);
            if (!petExists) throw new Error("No posees una mascota con ese ID.");

            profile.equipped = petId;
            equippedPet = RPG_CONFIG.PETS[petExists.type];
        });

        return equippedPet;
    }

    /**
     * Retrieves the active bonus percentage for a specific effect type.
     * @param {string} username - The user to check.
     * @param {import('../core/rpgConfig.js').PetEffectType} effectType - The type of bonus requested.
     * @returns {Promise<number>} The percentage of the bonus (0 if none).
     */
    async getBonus(username, effectType) {
        const profile = await this.petRepo.getProfile(username);
        if (!profile.equipped) return 0;
        
        const petInstance = profile.pets.find(p => p.id === profile.equipped);
        if (!petInstance) return 0;

        const petConfig = RPG_CONFIG.PETS[petInstance.type];
        if (!petConfig) return 0;

        if (petConfig.effectType === effectType || petConfig.effectType === "ALL_BONUS") {
            return petConfig.value;
        }
        
        return 0;
    }
}