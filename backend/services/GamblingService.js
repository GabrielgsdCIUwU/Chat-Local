export class GamblingService {
    /**
     * @param {import('../repositories/GamblingRepository.js').GamblingRepository} gamblingRepository 
     * @param {import('./EconomyService.js').EconomyService} economyService
     * @param {import('./PetService.js').PetService} petService
     * @param {import('./GuildService.js').GuildService} guildService
     */
    constructor(gamblingRepository, economyService, petService, guildService) {
        this.repo = gamblingRepository;
        this.economy = economyService;
        this.petService = petService;
        this.guildService = guildService;
    }

    /**
     * Ensures a gambler exists. If not, initializes a new profile.
     * Note: This must be called INSIDE a transaction to be race-condition safe.
     * @param {import('../repositories/GamblingRepository.js').Gambler[]} users 
     * @param {string} username 
     * @returns {import('../repositories/GamblingRepository.js').Gambler}
     */
    ensureUserExists(users, username) {
        let user = users.find(u => u.name === username);
        if (!user) {
            user = {
                name: username, totalEarnings: 0, spend: 0,
                timesSteal: 0, moneySteal: 0, duelWin: 0, duelLose: 0,
                bankRupt: 0
            };
            users.push(user);
        }
        return user;
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