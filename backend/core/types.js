//region Domain & Entitties
/**
 * Represents a registered system user.
 * @typedef {Object} User
 * @property {string} name - The unique username.
 * @property {string} passwd - The hashed credentials.
 * @property {string} location - The client's registered IP address.
 * @property {string[]} roles - List of assigned security roles.
 * @property {string} [color] - Hexadecimal color for presentation.
 * @property {string} [img] - The profile picture file extension if defined.
 */

/**
 * Safe Data Transfer Object representing user public/session information.
 * @typedef {Object} UserDTO
 * @property {string} name - The username.
 * @property {string[]} roles - Assigned security roles.
 * @property {string} [color] - Custom name color.
 */

/**
 * Holds financial state for a unique user.
 * @typedef {Object} WalletProps
 * @property {string} name - Owner's username.
 * @property {number} money - Available funds.
 * @property {number} debt - Unpaid liabilities.
 */

/**
 * Gambler statistics and cooling period metrics.
 * @typedef {Object} Gambler
 * @property {string} name - Username.
 * @property {number} totalEarnings - Accumulative winning balance.
 * @property {number} spend - Accumulative spending.
 * @property {number} timesSteal - Successive robbery attempts.
 * @property {number} moneySteal - Amount stolen.
 * @property {number} duelWin - Matches won.
 * @property {number} duelLose - Matches lost.
 * @property {number} bankRupt - Count of bankruptcy calls.
 * @property {number} lastRobbery - Timestamp of the last heist.
 * @property {number} lastDaily - Timestamp of the last daily reward.
 * @property {number} dailyStreak - Consecutive daily reward streak.
 */

/**
 * Details of an active auction item.
 * @typedef {Object} AuctionItem
 * @property {string} id - Unique identifier.
 * @property {string} seller - Seller's username.
 * @property {string} itemName - Asset name.
 * @property {number} amount - Item quantity.
 * @property {number} price - Total requested price.
 * @property {number} expiresAt - Timestamp of auction closure.
 */


//region Infrastructure & Persistance
/**
 * Interface representing a transactional and queryable database client.
 * @typedef {Object} IDatabaseClient
 * @property {function(): Promise<any>} getDb - Retrieves the active connection instance.
 */

/**
 * Interface representing a simple key-value file storage system.
 * @typedef {Object} IKeyValueStore
 * @property {function(): Promise<any[]>} read - Reads persistent raw data.
 * @property {function(any): Promise<void>} write - Overwrites active collection.
 * @property {function(function(any): any): Promise<any>} update - Executes an atomic transactional state update.
 */

/**
 * Generic Base Repository abstraction.
 * @template T
 * @typedef {Object} IBaseRepository
 * @property {function(): Promise<T[]>} getAll - Retrieves all records.
 * @property {function(function(T[]): Promise<void>|void): Promise<void>} executeTransaction - Safely handles database transactions.
 */

/**
 * User persistent repository interface.
 * @typedef {Object} IUserRepository
 * @property {function(): Promise<User[]>} findAll - Retrieves all users.
 * @property {function(string): Promise<User|undefined>} findByName - Searches a user by name.
 * @property {function(User): Promise<void>} save - Persists or updates a user profile.
 */

/**
 * Banned IP check repository interface.
 * @typedef {Object} IBannedIpRepository
 * @property {function(string): Promise<{ip: string, motivo: string}|undefined>} isBanned - Checks if an IP is blacklisted.
 */

/**
 * Economy persistent repository interface.
 * @typedef {IBaseRepository<import('../domain/economy/Wallet.js').Wallet>} IEconomyRepository
 * @property {function(any[], string): import('../domain/economy/Wallet.js').Wallet} ensureWallet - Returns active wallet or initializes it.
 */

/**
 * Gambling statistics repository interface.
 * @typedef {IBaseRepository<Gambler>} IGamblingRepository
 * @property {function(any[], string): Gambler} ensureUser - Returns active profile or initializes it.
 */


//region App & Services
/**
 * Identity and Access Management service.
 * @typedef {Object} IAuthService
 * @property {function(string, string, string): Promise<UserDTO>} login - Validates credentials and returns user metadata.
 * @property {function(string, string, string): Promise<void>} register - Validates and registers new identities.
 */

/**
 * Economy service domain orchestrator.
 * @typedef {Object} IEconomyService
 * @property {function(string): Promise<WalletProps>} getBalance - Fetches current financial state.
 * @property {function(string, number): Promise<number>} addFunds - Increases money balance (with dynamic debt repayment).
 * @property {function(string, number): Promise<void>} removeFunds - Decreases wallet funds.
 * @property {function(string, string, number): Promise<void>} transferFunds - Safely routes funds between wallets.
 * @property {function(number): Promise<WalletProps[]>} getTopRicher - Retrieves richest users sorted by funds.
 * @property {function(string, number): Promise<number>} forceRemoveFunds - Safe subtraction matching balance limit.
 * @property {function(string, number): Promise<void>} declareBankruptcy - Triggers bankruptcy protocols.
 */

/**
 * Gacha, pets and companion modifier bonus service.
 * @typedef {Object} IPetService
 * @property {function(string, number): Promise<number>} buyEgg - Registers companion egg acquisitions.
 * @property {function(string): Promise<any>} openEgg - Hatches an egg and returns random companion attributes.
 * @property {function(string, string): Promise<any|null>} equipPet - Assigns or unequips active companion.
 * @property {function(string, string): Promise<number>} getBonus - Returns modifier percentage value for activities.
 * @property {function(string, string): Promise<{petConfig: any, refundAmount: number}>} releasePet - Recycles pet for flat currency value.
 */

/**
 * Guild administration and ranking service.
 * @typedef {Object} IGuildService
 * @property {function(string, string): Promise<any>} createGuild - Funds a clan.
 * @property {function(string): Promise<any|undefined>} getUserGuild - Fetches active guild for player.
 * @property {function(number): Promise<any[]>} getTopGuilds - Obtains guild ranking metrics.
 * @property {function(string, string): Promise<string>} inviteMember - Issues a pending invitation.
 * @property {function(string, boolean): Promise<string>} resolveInvite - Accepts or rejects invitation.
 * @property {function(string, number): Promise<{levelUp: boolean, currentLevel: number}>} donate - Deposits funds into the guild treasury.
 * @property {function(string): Promise<void>} leaveGuild - Removes player from guild.
 * @property {function(string): Promise<number>} getUserGuildLevel - Quick check of player guild tier.
 */

export default {};