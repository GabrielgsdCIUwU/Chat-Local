/**
 * Economy application service handling safe transactions, fund transfers, and balance audits.
 */
export class EconomyService {
    /**
     * @param {import('../core/types.js').IEconomyRepository} economyRepository - The persistent SQLite economy repository.
     */
    constructor(economyRepository) {
        this.repo = economyRepository;
    }

    /**
     * Retrieves the current wallet information for a user.
     *
     * If the user does not already have a wallet, one is automatically
     * created with the default starting values.
     *
     * @param {string} username - Username whose wallet should be retrieved.
     * @returns {Promise<import('../core/types.js').WalletProps>} The user's wallet data structure.
     */
    async getBalance(username) {
        const wallet = await this.repo.findById(username);
        if (!wallet) {
            return { name: username, money: 100, debt: 0 };
        }
        return wallet.toJSON();
    }

    /**
     * Adds funds to a user's wallet.
     *
     * If the user has outstanding debt, 20% of the deposited amount is
     * automatically used to repay the debt (up to the remaining debt amount).
     * The rest is credited to the user's balance.
     * 
     * @param {string} username - Username of the wallet owner.
     * @param {number} amount - Positive integer amount to add.
     * @returns {Promise<number>} The net amount credited to the user's balance after debt repayment.
     * @throws {Error} If the amount is not a positive safe integer.
     */
    async addFunds(username, amount) {
        if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("La cantidad no es válida");

        let actualEarnings = 0;
        await this.repo.updateTransactional(username, (wallet) => {
            actualEarnings = wallet.addFunds(amount);
        });
        return actualEarnings;
    }

    /**
     * Removes funds from a user's wallet.
     *
     * The specified amount is deducted from the user's available balance.
     * The operation fails if the user does not have sufficient funds.
     *
     * @param {string} username - Username of the wallet owner.
     * @param {number} amount - Positive integer amount to remove.
     * @returns {Promise<void>}
     * @throws {Error} If the amount is not a positive safe integer.
     * @throws {Error} If the user does not have enough funds.
     */
    async removeFunds(username, amount) {
        if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("La cantidad no es válida");

        await this.repo.updateTransactional(username, (wallet) => {
            wallet.removeFunds(amount);
        });
    }

    /**
     * Transfers funds from one user's wallet to another.
     *
     * The transfer amount is deducted from the sender's balance and
     * credited in full to the recipient's balance.
     *
     * @param {string} senderName - Username of the sender.
     * @param {string} targetName - Username of the recipient.
     * @param {number} amount - Positive integer amount to transfer.
     * @returns {Promise<void>}
     * @throws {Error} If the sender and recipient are the same user.
     * @throws {Error} If the amount is not a positive safe integer.
     * @throws {Error} If the sender does not have enough funds.
     */
    async transferFunds(senderName, targetName, amount) {
        if (senderName === targetName) throw new Error("No puedes transferir dinero a ti mismo");
        if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("La cantidad no es válida");

        await this.repo.updateTransactional(senderName, (sender) => {
            sender.removeFunds(amount);
        });

        await this.repo.updateTransactional(targetName, (target) => {
            target.addFunds(amount);
        });

    }

    /**
     * Retrieves the richest users ordered by available balance.
     *
     * Returns a list of wallets sorted in descending order by their
     * current balance, limited to the specified number of entries.
     *
     * @param {number} [limit=10] - Maximum number of wallets to return.
     * @returns {Promise<import('../core/types.js').WalletProps[]>} A list of wallets sorted by wealth.
     */
    async getTopRicher(limit = 10) {
        const wallets = await this.repo.getAll();
        return wallets.toSorted((a, b) => b.money - a.money).slice(0, limit).map(w => w.toJSON());
    }

    /**
     * Removes funds from a user's wallet, up to the available balance.
     *
     * This method never causes the wallet balance to become negative.
     * If the requested amount exceeds the user's balance, only the
     * available funds are removed.
     *
     * @param {string} username - Username of the wallet owner.
     * @param {number} amount - Amount to remove.
     * @returns {Promise<number>} The actual amount removed from the wallet.
     */
    async forceRemoveFunds(username, amount) {
        let removedAmount = 0;
        await this.repo.updateTransactional(username, (wallet) => {
            removedAmount = wallet.forceRemoveFunds(amount);
        });
        return removedAmount;
    }

    /**
     * Declares bankruptcy for a user.
     *
     * Bankruptcy can only be declared when the user's balance is zero.
     * The user receives the default starting balance, and an additional
     * debt is incurred. The debt amount increases based on the number
     * of previous bankruptcies.
     *
     * @param {string} username - Username declaring bankruptcy.
     * @param {number} bankRuptCount - Number of previous bankruptcies used to scale the new debt.
     * @returns {Promise<void>}
     * @throws {Error} If the user still has funds available.
     */
    async declareBankruptcy(username, bankRuptCount) {
        await this.repo.updateTransactional(username, (wallet) => {
            wallet.declareBankruptcy(bankRuptCount);
        });
    }
}