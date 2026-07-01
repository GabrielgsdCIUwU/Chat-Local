/**
 * @typedef {import('../core/types.js').Gambler} Gambler
 */
export class GamblingService {
    /**
     * @param {import('../core/types.js').IGamblingRepository} gamblingRepository 
     * @param {import('../core/types.js').IEconomyService} economyService
     * @param {import('../core/types.js').IPetService} petService
     * @param {import('../core/types.js').IGuildService} guildService
     */
    constructor(gamblingRepository, economyService, petService, guildService) {
        this.repo = gamblingRepository;
        this.economy = economyService;
        this.petService = petService;
        this.guildService = guildService;
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