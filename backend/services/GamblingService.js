import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GAME_CONFIG } from '../core/constants.js';
import { Gambler } from '../domain/gambling/Gambler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class GamblingService {
    /**
     * @param {import('../core/types.js').IGamblingRepository} gamblingRepository - Gambling repository interface.
     * @param {import('../core/types.js').IEconomyService} economyService - Economy service interface.
     * @param {import('../core/types.js').IPetService} petService - Companion service interface.
     * @param {import('../core/types.js').IGuildService} guildService - Clan service interface.
     * @param {import('../core/types.js').ICraftingService} craftingService - Buff manager service interface.
     */
    constructor(gamblingRepository, economyService, petService, guildService, craftingService) {
        this.repo = gamblingRepository;
        this.economy = economyService;
        this.petService = petService;
        this.guildService = guildService;
        this.craftingService = craftingService;
        this.nonCountDaysPath = path.join(__dirname, "../../public/json/nonCountDays.json");
    }

    /**
     * Claims the daily reward, calculating streak and applying bonuses sequentially.
     * 
     * @param {string} username - User claiming the reward.
     * @param {number} timestamp - Action execution time.
     * @returns {Promise<import('../core/types.js').ClaimDailyResult>} Structured response of the claim.
     */
    async claimDaily(username, timestamp) {
        /** @type {string[]} */
        let nonCountDays = [];
        try {
            const rawData = await fs.readFile(this.nonCountDaysPath, "utf-8");
            nonCountDays = JSON.parse(rawData);
        } catch {
            nonCountDays = [];
        }

        const baseAmount = GAME_CONFIG.GAMBLING.DAILY.BASE_REWARD;
        let finalStreak = 0;
        let isNewStreak = false;
        let streakBonus = 0;

        await this.repo.updateTransactional(username, (gambler) => {
            const result = gambler.calculateDailyStreak(timestamp, nonCountDays);
            finalStreak = result.streak;
            isNewStreak = result.isNewStreak;

            const { BONUS_MIN, BONUS_MAX } = GAME_CONFIG.GAMBLING.DAILY;
            const randomBonusFactor = Math.floor(Math.random() * (BONUS_MAX - BONUS_MIN + 1)) + BONUS_MIN;
            streakBonus = finalStreak * randomBonusFactor;
        });

        const totalBaseReward = baseAmount + streakBonus;
        const { actualEarnings, petMsg } = await this.addRewardWithBonus(username, totalBaseReward);

        await this.repo.updateTransactional(username, (gambler) => {
            gambler.recordEarnings(actualEarnings);
        });

        return {
            actualEarnings,
            streakBonus,
            finalStreak,
            petMsg,
            isNewStreak
        };
    }

    /**
     * Processes robbery attempts securely, managing anti-rob protection, balance checks, and fines.
     * 
     * @param {string} thiefName - Username initiating robbery.
     * @param {string} victimName - Target victim username.
     * @param {number} amount - Desired amount to steal.
     * @param {number} timestamp - Action execution timestamp.
     * @returns {Promise<import('../core/types.js').RobberyResult>} The formatted result metrics.
     */
    async rob(thiefName, victimName, amount, timestamp) {
        if (thiefName === victimName) {
            throw new Error("No puedes robarte a ti mismo.");
        }

        const existingProfile = await this.repo.findById(thiefName);
        const thiefProfile = existingProfile || Gambler.createDefault(thiefName);
        thiefProfile.checkRobberyCooldown(timestamp);

        const penaltyAmount = amount + Math.floor(amount / GAME_CONFIG.ROB_CONFIG.PENALTY_DIVISOR);
        const thiefWallet = await this.economy.getBalance(thiefName);
        if (thiefWallet.money < penaltyAmount) {
            throw new Error(`Para intentar robar **${amount}€**, necesitas tener al menos **${penaltyAmount}€** para cubrir la fianza.`);
        }

        const victimWallet = await this.economy.getBalance(victimName);
        if (victimWallet.money < amount) {
            throw new Error(`La víctima solo tiene **${victimWallet.money}€**.`);
        }

        const wardConsumed = await this.craftingService.consumeBuff(victimName, "anti_rob");
        
        if (wardConsumed) {
            const actualPenalty = await this.economy.forceRemoveFunds(thiefName, penaltyAmount);
            await this.repo.updateTransactional(thiefName, (thief) => {
                thief.markRobberyAttempt(timestamp);
                thief.recordSpend(actualPenalty);
            });
            return { outcome: 'ward', penalty: actualPenalty, stolenAmount: 0, totalEarned: 0, petMsg: "" };
        }

        const percentageStolen = amount / victimWallet.money;
        const { MAX_CHANCE, CHANCE_SCALING } = GAME_CONFIG.ROB_CONFIG;
        const successChance = MAX_CHANCE - (percentageStolen * CHANCE_SCALING);

        if (Math.random() < successChance) {
            const { totalEarned, petMsg } = await this.processRobberyWin(thiefName, victimName, amount);
            await this.repo.updateTransactional(thiefName, (thief) => {
                thief.markRobberyAttempt(timestamp);
                thief.recordEarnings(totalEarned);
            });
            return { outcome: 'success', penalty: 0, stolenAmount: amount, totalEarned, petMsg };
        } else {
            const actualPenalty = await this.economy.forceRemoveFunds(thiefName, penaltyAmount);
            await this.repo.updateTransactional(thiefName, (thief) => {
                thief.markRobberyAttempt(timestamp);
                thief.recordSpend(actualPenalty);
            });
            return { outcome: 'fail', penalty: actualPenalty, stolenAmount: 0, totalEarned: 0, petMsg: "" };
        }
    }

    /**
     * Adds funds to a user applying any active gambling bonuses from their pets and guild.
     * @param {string} username - The user receiving the reward.
     * @param {number} baseAmount - The original reward amount before bonuses.
     * @returns {Promise<{ actualEarnings: number, petMsg: string }>} Result of the transaction.
     */
    async addRewardWithBonus(username, baseAmount) {
        const petBonus = await this.petService.getBonus(username, "GAMBLING_BONUS");
        const guildLevel = await this.guildService.getUserGuildLevel(username);
        const guildBonus = guildLevel * 2;

        const totalBonusPercent = petBonus + guildBonus;
        let extraBonus = 0;
        
        if (totalBonusPercent > 0) {
            extraBonus = Math.floor(baseAmount * (totalBonusPercent / 100));
        }
        
        const totalReward = baseAmount + extraBonus;
        const actualEarnings = await this.economy.addFunds(username, totalReward);
        
        let bonusMessages = [];
        if (petBonus > 0) bonusMessages.push(`+${petBonus}% mascota`);
        if (guildBonus > 0) bonusMessages.push(`+${guildBonus}% gremio nv.${guildLevel}`);
        
        const petMsg = bonusMessages.length > 0 ? ` (${bonusMessages.join(' | ')})` : "";

        return { actualEarnings, petMsg };
    }

    /**
     * Processes a successful robbery, transferring funds and applying bonuses independently.
     * @param {string} thiefName - The user stealing.
     * @param {string} victimName - The user being robbed.
     * @param {number} amount - The base amount stolen.
     * @returns {Promise<{ totalEarned: number, petMsg: string }>} Result of the robbery.
     */
    async processRobberyWin(thiefName, victimName, amount) {
        await this.economy.transferFunds(victimName, thiefName, amount);
        
        const petBonus = await this.petService.getBonus(thiefName, "GAMBLING_BONUS");
        const guildLevel = await this.guildService.getUserGuildLevel(thiefName);
        const guildBonus = guildLevel * 2; 

        const totalBonusPercent = petBonus + guildBonus;
        let extraBonus = 0;

        if (totalBonusPercent > 0) {
            extraBonus = Math.floor(amount * (totalBonusPercent / 100));
            await this.economy.addFunds(thiefName, extraBonus);
        }

        const totalEarned = amount + extraBonus;
        
        let bonusMessages = [];
        if (petBonus > 0) bonusMessages.push(`+${petBonus}% mascota`);
        if (guildBonus > 0) bonusMessages.push(`+${guildBonus}% gremio nv.${guildLevel}`);

        const petMsg = bonusMessages.length > 0 ? ` (Bono extra: ${bonusMessages.join(' | ')})` : "";

        return { totalEarned, petMsg };
    }
}