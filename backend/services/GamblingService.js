export class GamblingService {
    /**
     * @param {import('../repositories/GamblingRepository.js').GamblingRepository} gamblingRepository 
     */
    constructor(gamblingRepository) {
        this.repo = gamblingRepository;
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
                name: username, money: 100, totalEarnings: 0, spend: 0,
                timesSteal: 0, moneySteal: 0, duelWin: 0, duelLose: 0,
                bankRupt: 0, debt: 0
            };
            users.push(user);
        }
        return user;
    }

    /**
     * Validates if a transaction between two users is valid.
     * @param {import('../repositories/GamblingRepository.js').Gambler[]} users 
     * @param {string} senderName 
     * @param {string} targetName 
     * @param {number} amount
     * @throws {Error} If validation fails.
     * @returns {{sender: import('../repositories/GamblingRepository.js').Gambler, target: import('../repositories/GamblingRepository.js').Gambler}}
     */
    validateTransaction(users, senderName, targetName, amount) {
        if (senderName === targetName) throw new Error("No puedes interacturar contigo mismo.");

        const sender = users.find(u => u.name === senderName);
        const target = users.find(u => u.name === targetName);

        if (!target) throw new Error(`El usuario ${targetName} no existe como gambler.`);
        if (Number.isSafeInteger(amount) || amount <= 0) throw new Error("La cantidad no es válida.");
        if (sender.money < amount) throw new Error(`No tienes sufciente dinero. Tienes ${sender.money}€.`);

        return { sender, target };
    }
}