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
 * Represents a blacklisted IP record.
 * @typedef {Object} BannedIp
 * @property {string} ip - The banned IP address.
 * @property {string} reason - The reason for the ban.
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

/**
 * Profile and professional specialization metrics for RPG jobs.
 * @typedef {Object} JobProfile
 * @property {string} name - Username of the worker.
 * @property {string|null} job - Specialized class (e.g., 'minero', 'leñador', 'pescador').
 * @property {number} toolLevel - Current tier level of the workspace tool.
 * @property {number} lastWork - Epoch timestamp of the last work execution.
 * @property {Object.<string, number>} activeBuffs - Active temporary potion enhancements mapped to expiration times.
 * @property {number} prestigeLevel - The accumulated prestige tier.
 * @property {Object|null} activeExpedition - Progress markers for running passive expeditions.
 */

/**
 * Individual instantiated pet properties.
 * @typedef {Object} PetInstance
 * @property {string} id - Unique UUID of the companion.
 * @property {string} type - Configuration key from RPG configs.
 */

/**
 * Profile housing companion assets and eggs.
 * @typedef {Object} PetProfile
 * @property {string} name - Username of the owner.
 * @property {number} eggs - Quantity of unhatched eggs.
 * @property {PetInstance[]} pets - List of obtained companions.
 * @property {string|null} equipped - Instance ID of the active companion.
 */

/**
 * Guild member details.
 * @typedef {Object} GuildMember
 * @property {string} name - Member's username.
 * @property {string} rank - Assigned guild authority tier ('Leader', 'Officer', 'Member').
 */

/**
 * Consolidated properties of a player guild.
 * @typedef {Object} GuildProps
 * @property {string} id - Unique identifier.
 * @property {string} name - Unique guild name.
 * @property {number} level - Current tier level.
 * @property {number} bankMoney - Safe funds deposited in the treasury.
 * @property {GuildMember[]} members - Array of joined members.
 */

/**
 * Detailed image metadata of emojis.
 * @typedef {Object} EmojiMetadata
 * @property {string} name - Filename of the emoji excluding the extension.
 * @property {number} width - Asset width in pixels.
 * @property {number} height - Asset height in pixels.
 * @property {string} url - Static file system routing URL.
 */

/**
 * Live global boss raid metrics.
 * @typedef {Object} RaidSession
 * @property {boolean} active - Flags if a battle is running.
 * @property {number} hp - Active hitpoints.
 * @property {number} maxHp - Boundary hitpoints of the boss.
 * @property {Object.<string, number>} damageLog - Damage tracking map keying usernames to values.
 * @property {number} expiresAt - Epoch timestamp marking end of fight.
 */

/**
 * Chat message history item attributes.
 * @typedef {Object} MessageProps
 * @property {string} id - Unique message UUID.
 * @property {string} user - Sender username.
 * @property {string} message - Unformatted string message.
 * @property {number} timestamp - Epoch timestamp of issuance.
 * @property {boolean} edited - Flag representing modification state.
 * @property {number} prestige - Prestige level of the sender at the time of sending.
 * @property {Array.<Object>} emojis - Message reactions.
 * @property {Object|null} reply - Parent message meta in thread structures.
 */


//region Infrastructure & Persistence
/**
 * Interface representing a transactional and queryable database client.
 * @typedef {Object} IDatabaseClient
 * @property {function(): Promise<any>} getDb - Retrieves the active connection instance.
 */

/**
 * Interface representing a transactional SQL connection context.
 * Duck-typed abstraction to avoid direct coupling with third-party libraries.
 * 
 * @typedef {Object} ISqlConnection
 * @property {function(string, ...any): Promise<any>} run - Executes statements (INSERT, UPDATE, DELETE).
 * @property {function(string, ...any): Promise<any[]>} all - Executes queries returning multiple rows.
 * @property {function(string, ...any): Promise<any>} get - Executes queries returning a single row.
 * @property {function(string): Promise<any>} exec - Executes raw multi-line SQL commands.
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
 * @property {function(string): Promise<BannedIp|undefined>} isBanned - Checks if an IP is blacklisted.
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

/**
 * RPG inventory persistence contract.
 * @typedef {IBaseRepository<import('../domain/rpg/Inventory.js').Inventory>} IInventoryRepository
 * @property {function(string): Promise<import('../domain/rpg/Inventory.js').Inventory>} getInventory - Yields an Inventory class wrapper.
 * @property {function(any[], string): import('../domain/rpg/Inventory.js').Inventory} ensureInventory - Transaction safe finder for inventory.
 */

/**
 * Job profile persistence contract.
 * @typedef {IBaseRepository<JobProfile>} IJobRepository
 * @property {function(string): Promise<JobProfile|undefined>} getProfile - Fetches user workspace profile.
 * @property {function(any[], string): JobProfile} ensureJobProfile - Obtains or configures a new job profile.
 */

/**
 * Companion assets persistence contract.
 * @typedef {IBaseRepository<PetProfile>} IPetRepository
 * @property {function(string): Promise<PetProfile>} getProfile - Retrieves the companion profile.
 * @property {function(any[], string): PetProfile} ensureProfile - Safely targets and returns the active profile.
 */

/**
 * Player clan persistence contract.
 * @typedef {IBaseRepository<GuildProps>} IGuildRepository
 */

/**
 * Active auctions persistence contract.
 * @typedef {IBaseRepository<AuctionItem>} IAuctionRepository
 * @property {function(string): Promise<boolean>} removeAuction - Removes auction record from store.
 */

/**
 * Message log persistence contract.
 * @typedef {Object} IMessageRepository
 * @property {function(): Promise<MessageProps[]>} getAll - Returns sorted historical message props.
 * @property {function(MessageProps): Promise<void>} saveMessage - Saves a message entry.
 * @property {function(string, string, string): Promise<void>} editMessage - Alters message text flag.
 * @property {function(string, string): Promise<void>} deleteMessage - Deletes an entry.
 * @property {function(string, string, string): Promise<void>} addReaction - Applies a user reaction to a message.
 */

/**
 * Adaptable world boss parameters persistence contract.
 * @typedef {Object} IBossRepository
 * @property {function(number): Promise<number>} getMaxHp - Returns maximum health parameters of the boss.
 * @property {function(number): Promise<void>} setMaxHp - Configures and writes new boss health dimensions.
 */


//region APP & Domain Services
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

/**
 * Bot internal configurations and dynamic module parsing service.
 * @typedef {Object} ICommandService
 * @property {function(string=): Promise<Object>} getCommandTree - Dynamically discovers and builds the command permission tree.
 */

/**
 * Multi-dimensional analysis of emoji directories.
 * @typedef {Object} IEmojiService
 * @property {function(): EmojiMetadata[]} getEmojiMetada - Scans local directories returning emoji metadata structures.
 */

/**
 * User visual customization adjustments.
 * @typedef {Object} IUserService
 * @property {function(string): Promise<{nombre: string, color: string, img: string|null}>} getUserData - Returns profiles metrics.
 * @property {function(string, string): Promise<boolean>} changeColor - Modifies name hex colors.
 * @property {function(string, string): Promise<boolean>} changeProfileImage - Updates avatar image format extension.
 * @property {function(string, string): Promise<void>} changename - Renegotiates username identity.
 */

/**
 * Potions and magic status operations administrator.
 * @typedef {Object} ICraftingService
 * @property {function(string, string): Promise<Object>} craftItem - Consumes resources and applies buff parameters.
 * @property {function(string): Promise<Object.<string, number>>} getActiveBuffs - Exposes active buffs with remaining durations.
 * @property {function(string, string): Promise<boolean>} consumeBuff - Instantly removes and evaluates custom buff active states.
 */

/**
 * Main game engine coordinating RPG dynamics.
 * @typedef {Object} IRPGService
 * @property {function(string, string): Promise<string>} joinJob - Sets primary RPG profession class.
 * @property {function(string): Promise<{actionText: string, items: Object.<string, number>}>} work - Triggers active job collection.
 * @property {function(string): Promise<string>} upgradeTool - Upgrades equipment.
 * @property {function(string, string, number): Promise<{itemName: string, totalValue: number}>} sellItem - Liquidates backpack assets.
 * @property {function(string): Promise<{profile: JobProfile|null, inventory: any}>} getFullProfile - Fetches complete RPG metrics.
 * @property {function(string): Promise<number>} executePrestige - Resets active RPG levels for permanent modifiers.
 * @property {function(string, string): Promise<Object>} startExpedition - Starts idle expeditions.
 * @property {function(): Promise<any[]>} processFinishedExpeditions - Automatically evaluates and collects idle items.
 */

/**
 * Market, Direct Trades and Auction House orchestrator.
 * @typedef {Object} IMarketService
 * @property {function(string, string, number, number): Promise<AuctionItem>} publishAuction - Publishes auction items.
 * @property {function(string, string): Promise<AuctionItem>} buyAuction - Buys an auction.
 * @property {function(): Promise<AuctionItem[]>} getActiveAuctions - Yields active non-expired auctions.
 * @property {function(): Promise<void>} checkExpiredAuctions - Checks and refunds expired auctions.
 * @property {function(string, string, string, number, string, number): Promise<Object>} proposeTrade - Starts transactional peer trading.
 * @property {function(string, boolean): Promise<any>} resolveTrade - Finalizes direct trade structures.
 */

/**
 * Real-time World Boss engine.
 * @typedef {Object} IRaidService
 * @property {function(any): Promise<void>} startRaid - Broadcasts raid commencement.
 * @property {function(string, any): Promise<void>} hitBoss - Deducts HP and registers damage logs.
 * @property {function(): Object|null} getSyncData - Syncs incoming live players with current session metrics.
 */

/**
 * Filters incoming messages in Socket.io threads.
 * @typedef {Object} IChatFilterService
 * @property {function(string, string, any, number): Promise<void>} processMessage - Evaluates and processes pipelines.
 * @property {function(string, string, any, number): Promise<void>} checkDonationSpam - Checks and counts developer donations.
 */

export default {};