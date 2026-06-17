export class GamblingService {
    /**
     * @param {import('../repositories/GamblingRepository.js').GamblingRepository} gamblingRepository 
     * @param {import('./EconomyService.js').EconomyService} economyService
     */
    constructor(gamblingRepository, economyService) {
        this.repo = gamblingRepository;
        this.economy = economyService;
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
}