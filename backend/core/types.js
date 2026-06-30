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
 * @property {string} motivo - The reason for the ban.
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
 * @typedef {import('../domain/gambling/Gambler.js').Gambler} Gambler
 */

/**
 * @typedef {Object} ActiveExpedition
 * @property {string} zoneId Expedition id.
 * @property {number} endTime Timestamp when expedition ends.
 */

/**
 * @typedef {Object} UserInventory
 * @property {string} name - Username
 * @property {Object.<string, number>} items - Items map and quantity
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
 * Represents a direct player-to-player trade offer.
 * @typedef {Object} DirectTradeProps
 * @property {string} senderName - Username of the player creating the offer.
 * @property {string} sendItem - Item offered by the sender.
 * @property {number} sendAmount - Quantity of the offered item.
 * @property {string} reqItem - Item requested in exchange.
 * @property {number} reqAmount - Quantity of the requested item.
 * @property {number} expiresAt - Epoch timestamp when the trade offer expires.
 */

/**
 * Profile and professional specialization metrics for RPG jobs.
 * @typedef {import('../domain/rpg/JobProfile.js').JobProfile} JobProfile
 */

/**
 * @typedef {import('../domain/rpg/PetProfile.js').PetProfile} PetProfile
 */

/**
 * @typedef {import('../domain/guild/Guild.js').Guild} Guild
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
 * Tracks individual message emoji reactions.
 * @typedef {Object} EmojiReactionCount
 * @property {string} name - Name of the emoji.
 * @property {string[]} users - List of usernames who reacted with this emoji.
 */

/**
 * Represents a dynamic raid boss state.
 * @typedef {Object} RaidSession
 * @property {boolean} active - Indicates if a battle is running.
 * @property {number} hp - Active boss hitpoints.
 * @property {number} maxHp - Maximum health bounds.
 * @property {Object.<string, number>} damageLog - Damage mapped to participant usernames.
 * @property {number} expiresAt - Timestamp marking the end of the raid.
 */

/**
 * Chat message history item attributes.
 * @typedef {Object} MessageProps
 * @property {string} id - Unique message UUID.
 * @property {string} user - Sender username.
 * @property {string} message - Unformatted message string.
 * @property {number} timestamp - Epoch timestamp of creation.
 * @property {boolean} edited - Flag representing modification state.
 * @property {number} prestige - Prestige level of the sender at creation.
 * @property {EmojiReactionCount[]} emojis - Message reactions catalog.
 * @property {Object|null} reply - Optional parent message reference for threading.
 */


//region Infrastructure & Persistence
/**
 * Interface representing a Socket.IO server instance capable of broadcasting
 * events to all connected clients.
 * @abstract
 */
export class ISocketServer {
    /**
     * Broadcasts an event to all connected clients.
     * @param {string} event - Event name.
     * @param {...any} args - Event payload.
     * @returns {void}
     */
    emit(event, ...args) {
        throw new Error("Method 'emit()' must be implemented.");
    }
}

/**
 * Interface representing an individual Socket.IO client connection.
 * @abstract
 */
export class ISocket {
    constructor() {
        /**
         * Unique socket connection identifier.
         * @type {string}
         */
        this.id = "";
    }

    /**
     * Sends an event to this specific connected client.
     * @param {string} event - Event name.
     * @param {...any} args - Event payload.
     * @returns {void}
     */
    emit(event, ...args) {
        throw new Error("Method 'emit()' must be implemented.");
    }

    /**
     * Joins the socket to a specific room.
     * @param {string} room - Room identifier.
     * @returns {void}
     */
    join(room) {
        throw new Error("Method 'join()' must be implemented.");
    }
}

/**
 * Interface representing a transactional and queryable database client connection.
 * @abstract
 */
export class IDatabaseClient {
    /**
     * Retrieves the active database connection instance.
     * @returns {Promise<any>}
     */
    async getDb() {
        throw new Error("Method 'getDb()' must be implemented.");
    }
}

/**
 * Interface representing a transactional SQL connection context.
 * Duck-typed abstraction to avoid direct coupling with SQLite libraries.
 * @abstract
 */
export class ISqlConnection {
    /**
     * Executes statements (INSERT, UPDATE, DELETE).
     * @param {string} query
     * @param {...any} params
     * @returns {Promise<any>}
     */
    async run(query, ...params) {
        throw new Error("Method 'run()' must be implemented.");
    }

    /**
     * Executes queries returning multiple rows.
     * @param {string} query
     * @param {...any} params
     * @returns {Promise<any[]>}
     */
    async all(query, ...params) {
        throw new Error("Method 'all()' must be implemented.");
    }

    /**
     * Executes queries returning a single row.
     * @param {string} query
     * @param {...any} params
     * @returns {Promise<any>}
     */
    async get(query, ...params) {
        throw new Error("Method 'get()' must be implemented.");
    }

    /**
     * Executes raw multi-line SQL commands.
     * @param {string} sql
     * @returns {Promise<any>}
     */
    async exec(sql) {
        throw new Error("Method 'exec()' must be implemented.");
    }
}

/**
 * Interface representing a simple key-value file storage system (e.g. JSON database).
 * @abstract
 */
export class IKeyValueStore {
    /**
     * Reads persistent raw data.
     * @returns {Promise<any>}
     */
    async read() {
        throw new Error("Method 'read()' must be implemented.");
    }

    /**
     * Overwrites active collection on disk.
     * @param {any} data
     * @returns {Promise<void>}
     */
    async write(data) {
        throw new Error("Method 'write()' must be implemented.");
    }

    /**
     * Executes an atomic transactional state update callback.
     * @param {function(any): any} callback
     * @returns {Promise<any>}
     */
    async update(callback) {
        throw new Error("Method 'update()' must be implemented.");
    }
}

/**
 * Generic Base Repository abstraction.
 * @template T
 * @abstract
 */
export class IBaseRepository {
    /**
     * Retrieves all records.
     * @returns {Promise<T[]>}
     */
    async getAll() {
        throw new Error("Method 'getAll()' must be implemented.");
    }

    /**
     * Safely handles database transactions.
     * @param {function(T[]): Promise<any>|any} callback
     * @returns {Promise<void>}
     */
    async executeTransaction(callback) {
        throw new Error("Method 'executeTransaction()' must be implemented.");
    }
}

/**
 * User persistent repository interface.
 * @abstract
 */
export class IUserRepository {
    /**
     * Retrieves all users.
     * @returns {Promise<User[]>}
     */
    async findAll() {
        throw new Error("Method 'findAll()' must be implemented.");
    }

    /**
     * Searches a user by name.
     * @param {string} name - Username to query.
     * @returns {Promise<User|undefined>}
     */
    async findByName(name) {
        throw new Error("Method 'findByName()' must be implemented.");
    }

    /**
     * Persists or updates a user profile.
     * @param {User} user - User entity state.
     * @returns {Promise<void>}
     */
    async save(user) {
        throw new Error("Method 'save()' must be implemented.");
    }

    /**
     * Deletes a user profile by name.
     * @param {string} name - Username to delete.
     * @returns {Promise<void>}
     */
    async deleteByName(name) {
        throw new Error("Method 'deleteByName()' must be implemented.");
    }
}

/**
 * Banned IP check repository interface.
 * @abstract
 */
export class IBannedIpRepository {
    /**
     * Checks if an IP is blacklisted.
     * @param {string} ip - Target IP address.
     * @returns {Promise<BannedIp|undefined>}
     */
    async isBanned(ip) {
        throw new Error("Method 'isBanned()' must be implemented.");
    }
}

/**
 * Economy persistent repository interface.
 * @abstract
 * @extends {IBaseRepository<import('../domain/economy/Wallet.js').Wallet>}
 */
export class IEconomyRepository extends IBaseRepository {
    /**
     * Returns active wallet or initializes it.
     * @param {import('../domain/economy/Wallet.js').Wallet[]} wallets - Wallets pool.
     * @param {string} username - Target owner name.
     * @returns {import('../domain/economy/Wallet.js').Wallet}
     */
    ensureWallet(wallets, username) {
        throw new Error("Method 'ensureWallet()' must be implemented.");
    }
}

/**
 * Gambling statistics repository interface.
 * @abstract
 * @extends {IBaseRepository<Gambler>}
 */
export class IGamblingRepository extends IBaseRepository {
    /**
     * Returns active profile or initializes it.
     * @param {Gambler[]} users - Gamblers dataset.
     * @param {string} username - Target user.
     * @returns {Gambler}
     */
    ensureUser(users, username) {
        throw new Error("Method 'ensureUser()' must be implemented.");
    }
}

/**
 * RPG inventory persistence contract.
 * @abstract
 * @extends {IBaseRepository<import('../domain/rpg/Inventory.js').Inventory>}
 */
export class IInventoryRepository extends IBaseRepository {
    /**
     * Yields an Inventory domain class wrapper.
     * @param {string} username - Target username.
     * @returns {Promise<import('../domain/rpg/Inventory.js').Inventory>}
     */
    async getInventory(username) {
        throw new Error("Method 'getInventory()' must be implemented.");
    }

    /**
     * Transaction safe finder for inventories.
     * @param {import('../domain/rpg/Inventory.js').Inventory[]} inventories - Inventories pool.
     * @param {string} username - Target owner name.
     * @returns {import('../domain/rpg/Inventory.js').Inventory}
     */
    ensureInventory(inventories, username) {
        throw new Error("Method 'ensureInventory()' must be implemented.");
    }
}

/**
 * Job profile persistence contract.
 * @abstract
 * @extends {IBaseRepository<JobProfile>}
 */
export class IJobRepository extends IBaseRepository {
    /**
     * Fetches user job profile.
     * @param {string} username - Target username.
     * @returns {Promise<JobProfile|undefined>}
     */
    async getProfile(username) {
        throw new Error("Method 'getProfile()' must be implemented.");
    }

    /**
     * Obtains or configures a new job profile within an active transaction.
     * @param {JobProfile[]} jobs - Jobs pool.
     * @param {string} username - Target username.
     * @returns {JobProfile}
     */
    ensureJobProfile(jobs, username) {
        throw new Error("Method 'ensureJobProfile()' must be implemented.");
    }
}

/**
 * Companion assets persistence contract.
 * @abstract
 * @extends {IBaseRepository<PetProfile>}
 */
export class IPetRepository extends IBaseRepository {
    /**
     * Retrieves the companion profile.
     * @param {string} username - Target username.
     * @returns {Promise<PetProfile>}
     */
    async getProfile(username) {
        throw new Error("Method 'getProfile()' must be implemented.");
    }

    /**
     * Safely targets and returns the active profile within an active transaction.
     * @param {PetProfile[]} profiles - Profiles pool.
     * @param {string} username - Target username.
     * @returns {PetProfile}
     */
    ensureProfile(profiles, username) {
        throw new Error("Method 'ensureProfile()' must be implemented.");
    }
}

/**
 * Player clan persistence contract.
 * @abstract
 * @extends {IBaseRepository<Guild>}
 */
export class IGuildRepository extends IBaseRepository {}

/**
 * Active auctions persistence contract.
 * @abstract
 * @extends {IBaseRepository<AuctionItem>}
 */
export class IAuctionRepository extends IBaseRepository {
    /**
     * Removes an auction record from active store.
     * @param {string} id - Auction list UUID.
     * @returns {Promise<boolean>}
     */
    async removeAuction(id) {
        throw new Error("Method 'removeAuction()' must be implemented.");
    }
}

/**
 * Message log persistence contract.
 * @abstract
 */
export class IMessageRepository {
    /**
     * Returns sorted historical message properties.
     * @returns {Promise<MessageProps[]>}
     */
    async getAll() {
        throw new Error("Method 'getAll()' must be implemented.");
    }

    /**
     * Saves a message entry.
     * @param {MessageProps} messageObj - Target message.
     * @returns {Promise<void>}
     */
    async saveMessage(messageObj) {
        throw new Error("Method 'saveMessage()' must be implemented.");
    }

    /**
     * Alters message content and triggers edited flags.
     * @param {string} id - Message unique UUID.
     * @param {string} username - Author of the original message.
     * @param {string} newText - New content string.
     * @returns {Promise<void>}
     */
    async editMessage(id, username, newText) {
        throw new Error("Method 'editMessage()' must be implemented.");
    }

    /**
     * Deletes a message entry.
     * @param {string} id - Message unique UUID.
     * @param {string} username - Author username.
     * @returns {Promise<void>}
     */
    async deleteMessage(id, username) {
        throw new Error("Method 'deleteMessage()' must be implemented.");
    }

    /**
     * Applies a user reaction to a message.
     * @param {string} messageId - Message unique UUID.
     * @param {string} emojiName - Emoji name identifier.
     * @param {string} username - User who reacted.
     * @returns {Promise<void>}
     */
    async addReaction(messageId, emojiName, username) {
        throw new Error("Method 'addReaction()' must be implemented.");
    }
}

/**
 * Adaptable world boss parameters persistence contract.
 * @abstract
 */
export class IBossRepository {
    /**
     * Returns maximum health parameters of the boss.
     * @param {number} defaultHP - Fallback HP.
     * @returns {Promise<number>}
     */
    async getMaxHp(defaultHP) {
        throw new Error("Method 'getMaxHp()' must be implemented.");
    }

    /**
     * Configures and writes new boss health dimensions.
     * @param {number} maxHp - New health.
     * @returns {Promise<void>}
     */
    async setMaxHp(maxHp) {
        throw new Error("Method 'setMaxHp()' must be implemented.");
    }
}

//region APP & Domain Services
/**
 * Identity and Access Management service contract.
 * @abstract
 */
export class IAuthService {
    /**
     * Validates credentials and returns user session metadata.
     * @param {string} name - Username.
     * @param {string} password - Input password.
     * @param {string} ip - Origin request IP.
     * @returns {Promise<UserDTO>}
     */
    async login(name, password, ip) {
        throw new Error("Method 'login()' must be implemented.");
    }

    /**
     * Validates and registers new identities.
     * @param {string} name - Requested username.
     * @param {string} password - User password.
     * @param {string} ip - Origin request IP.
     * @returns {Promise<void>}
     */
    async register(name, password, ip) {
        throw new Error("Method 'register()' must be implemented.");
    }
}

/**
 * Economy service domain orchestrator contract.
 * @abstract
 */
export class IEconomyService {
    /**
     * Fetches current financial state of a wallet.
     * @param {string} username - Wallet owner name.
     * @returns {Promise<WalletProps>}
     */
    async getBalance(username) {
        throw new Error("Method 'getBalance()' must be implemented.");
    }

    /**
     * Increases money balance (with automatic debt repayment handling).
     * @param {string} username - Target wallet owner name.
     * @param {number} amount - Safe integer to deposit.
     * @returns {Promise<number>} Net amount credited after debt payoffs.
     */
    async addFunds(username, amount) {
        throw new Error("Method 'addFunds()' must be implemented.");
    }

    /**
     * Decreases wallet funds.
     * @param {string} username - Target wallet owner name.
     * @param {number} amount - Safe integer to subtract.
     * @returns {Promise<void>}
     */
    async removeFunds(username, amount) {
        throw new Error("Method 'removeFunds()' must be implemented.");
    }

    /**
     * Safely routes funds between wallets.
     * @param {string} senderName - Origin account.
     * @param {string} targetName - Destination account.
     * @param {number} amount - Safe integer.
     * @returns {Promise<void>}
     */
    async transferFunds(senderName, targetName, amount) {
        throw new Error("Method 'transferFunds()' must be implemented.");
    }

    /**
     * Retrieves richest users sorted by funds.
     * @param {number} limit - Slice boundaries.
     * @returns {Promise<WalletProps[]>}
     */
    async getTopRicher(limit) {
        throw new Error("Method 'getTopRicher()' must be implemented.");
    }

    /**
     * Safe subtraction matching balance limit bounds.
     * @param {string} username - Target owner.
     * @param {number} amount - Requested amount.
     * @returns {Promise<number>} Actual funds extracted.
     */
    async forceRemoveFunds(username, amount) {
        throw new Error("Method 'forceRemoveFunds()' must be implemented.");
    }

    /**
     * Triggers bankruptcy protocols resetting state and setting penalty debt.
     * @param {string} username - Bankrupt user.
     * @param {number} bankRuptCount - Occurrences multiplier.
     * @returns {Promise<void>}
     */
    async declareBankruptcy(username, bankRuptCount) {
        throw new Error("Method 'declareBankruptcy()' must be implemented.");
    }
}

/**
 * Gacha, pets and companion modifier bonus service contract.
 * @abstract
 */
export class IPetService {
    /**
     * Registers companion egg acquisitions.
     * @param {string} username - User name.
     * @param {number} amount - Quantity.
     * @returns {Promise<number>} Total currency subtracted.
     */
    async buyEgg(username, amount) {
        throw new Error("Method 'buyEgg()' must be implemented.");
    }

    /**
     * Hatches an egg and returns random companion attributes.
     * @param {string} username - Active user.
     * @returns {Promise<import('./rpgConfig.js').PetConfig>}
     */
    async openEgg(username) {
        throw new Error("Method 'openEgg()' must be implemented.");
    }

    /**
     * Assigns or unequips active companion.
     * @param {string} username - Active user.
     * @param {string} petId - Target UUID or 'none'.
     * @returns {Promise<import('./rpgConfig.js').PetConfig|null>}
     */
    async equipPet(username, petId) {
        throw new Error("Method 'equipPet()' must be implemented.");
    }

    /**
     * Returns modifier percentage value for activities.
     * @param {string} username - User name.
     * @param {import('./rpgConfig.js').PetEffectType} effectType - Modifier type.
     * @returns {Promise<number>}
     */
    async getBonus(username, effectType) {
        throw new Error("Method 'getBonus()' must be implemented.");
    }

    /**
     * Recycles a pet for flat currency value.
     * @param {string} username - Target owner.
     * @param {string} petId - Pet unique UUID.
     * @returns {Promise<{petConfig: import('./rpgConfig.js').PetConfig, refundAmount: number}>}
     */
    async releasePet(username, petId) {
        throw new Error("Method 'releasePet()' must be implemented.");
    }
}

/**
 * Guild administration and ranking service contract.
 * @abstract
 */
export class IGuildService {
    /**
     * Funds a clan.
     * @param {string} founderName - Funding user.
     * @param {string} guildName - Clan name.
     * @returns {Promise<Guild>}
     */
    async createGuild(founderName, guildName) {
        throw new Error("Method 'createGuild()' must be implemented.");
    }

    /**
     * Fetches active guild for player.
     * @param {string} username - Target player name.
     * @returns {Promise<Guild|undefined>}
     */
    async getUserGuild(username) {
        throw new Error("Method 'getUserGuild()' must be implemented.");
    }

    /**
     * Obtains guild ranking metrics.
     * @param {number} limit - Slice bounds.
     * @returns {Promise<Guild[]>}
     */
    async getTopGuilds(limit) {
        throw new Error("Method 'getTopGuilds()' must be implemented.");
    }

    /**
     * Issues a pending invitation.
     * @param {string} inviterName - Issuer name.
     * @param {string} targetName - Target name.
     * @returns {Promise<string>} Guild display name.
     */
    async inviteMember(inviterName, targetName) {
        throw new Error("Method 'inviteMember()' must be implemented.");
    }

    /**
     * Accepts or rejects invitation.
     * @param {string} targetName - Target invite candidate name.
     * @param {boolean} accept - Outcome option.
     * @returns {Promise<string>} Guild display name.
     */
    async resolveInvite(targetName, accept) {
        throw new Error("Method 'resolveInvite()' must be implemented.");
    }

    /**
     * Deposits funds into the guild treasury.
     * @param {string} username - Depositor name.
     * @param {number} amount - Value to deposit.
     * @returns {Promise<{levelUp: boolean, currentLevel: number}>}
     */
    async donate(username, amount) {
        throw new Error("Method 'donate()' must be implemented.");
    }

    /**
     * Removes player from active guild.
     * @param {string} username - Target username.
     * @returns {Promise<void>}
     */
    async leaveGuild(username) {
        throw new Error("Method 'leaveGuild()' must be implemented.");
    }

    /**
     * Quick check of player guild tier index.
     * @param {string} username - Target username.
     * @returns {Promise<number>}
     */
    async getUserGuildLevel(username) {
        throw new Error("Method 'getUserGuildLevel()' must be implemented.");
    }
}

/**
 * Bot internal configurations and dynamic module parsing service contract.
 * @abstract
 */
export class ICommandService {
    /**
     * Dynamically discovers and builds the command permission tree.
     * @param {string} [dir] - Filesystem target.
     * @returns {Promise<Object>}
     */
    async getCommandTree(dir) {
        throw new Error("Method 'getCommandTree()' must be implemented.");
    }
}

/**
 * Multi-dimensional analysis of emoji directories contract.
 * @abstract
 */
export class IEmojiService {
    /**
     * Scans local directories returning emoji metadata structures.
     * @returns {EmojiMetadata[]}
     */
    getEmojiMetada() {
        throw new Error("Method 'getEmojiMetada()' must be implemented.");
    }
}

/**
 * User visual customization adjustments service contract.
 * @abstract
 */
export class IUserService {
    /**
     * Returns profiles customization metrics.
     * @param {string} username - Target user.
     * @returns {Promise<{nombre: string, color: string, img: string|null}>}
     */
    async getUserData(username) {
        throw new Error("Method 'getUserData()' must be implemented.");
    }

    /**
     * Modifies name hex colors.
     * @param {string} username - Target user.
     * @param {string} newColor - Hexadecimal color code.
     * @returns {Promise<boolean>}
     */
    async changeColor(username, newColor) {
        throw new Error("Method 'changeColor()' must be implemented.");
    }

    /**
     * Updates avatar image format extension.
     * @param {string} username - Target user.
     * @param {string} extension - Image extension name (e.g. '.png').
     * @returns {Promise<boolean>}
     */
    async changeProfileImage(username, extension) {
        throw new Error("Method 'changeProfileImage()' must be implemented.");
    }

    /**
     * Renegotiates username identity across persistent logs and files.
     * @param {string} oldName - Current name.
     * @param {string} newName - Target new name.
     * @returns {Promise<void>}
     */
    async changename(oldName, newName) {
        throw new Error("Method 'changename()' must be implemented.");
    }
}

/**
 * Potions and magic status operations administrator contract.
 * @abstract
 */
export class ICraftingService {
    /**
     * Consumes resources and applies buff parameters.
     * @param {string} username - Caller username.
     * @param {string} recipeKey - Recipe target name.
     * @returns {Promise<import('./rpgConfig.js').CraftingRecipe>}
     */
    async craftItem(username, recipeKey) {
        throw new Error("Method 'craftItem()' must be implemented.");
    }

    /**
     * Exposes active buffs with remaining durations.
     * @param {string} username - Target user.
     * @returns {Promise<Object.<string, number>>} Mapped remaining milliseconds.
     */
    async getActiveBuffs(username) {
        throw new Error("Method 'getActiveBuffs()' must be implemented.");
    }

    /**
     * Instantly removes and evaluates custom buff active states.
     * @param {string} username - Target user.
     * @param {string} buffId - Buff identifier key.
     * @returns {Promise<boolean>}
     */
    async consumeBuff(username, buffId) {
        throw new Error("Method 'consumeBuff()' must be implemented.");
    }
}

/**
 * Main game engine coordinating RPG dynamics contract.
 * @abstract
 */
export class IRPGService {
    /**
     * Sets primary RPG profession class.
     * @param {string} username - Target user name.
     * @param {string} jobKey - Job configuration identifier.
     * @returns {Promise<string>} Job display name.
     */
    async joinJob(username, jobKey) {
        throw new Error("Method 'joinJob()' must be implemented.");
    }

    /**
     * Triggers active job collection, updating inventory and returning action loot metrics.
     * @param {string} username - Worker username.
     * @returns {Promise<{actionText: string, items: Object.<string, number>}>}
     */
    async work(username) {
        throw new Error("Method 'work()' must be implemented.");
    }

    /**
     * Upgrades equipment to the next tier, consuming funds and resources.
     * @param {string} username - Worker username.
     * @returns {Promise<string>} Unlocked equipment display name.
     */
    async upgradeTool(username) {
        throw new Error("Method 'upgradeTool()' must be implemented.");
    }

    /**
     * Liquidates backpack assets at fixed base system prices.
     * @param {string} username - Seller username.
     * @param {string} itemName - Target material name.
     * @param {number} amount - Quantity.
     * @returns {Promise<{itemName: string, totalValue: number}>} Sold attributes.
     */
    async sellItem(username, itemName, amount) {
        throw new Error("Method 'sellItem()' must be implemented.");
    }

    /**
     * Fetches complete RPG metrics (job profiles and backpack inventories).
     * @param {string} username - Target player name.
     * @returns {Promise<{profile: JobProfile|null, inventory: any}>}
     */
    async getFullProfile(username) {
        throw new Error("Method 'getFullProfile()' must be implemented.");
    }

    /**
     * Resets active RPG levels for permanent modifiers.
     * @param {string} username - Target player name.
     * @returns {Promise<number>} Unlocked prestige index.
     */
    async executePrestige(username) {
        throw new Error("Method 'executePrestige()' must be implemented.");
    }

    /**
     * Starts idle passive explorations.
     * @param {string} username - Target username.
     * @param {string} zoneKey - Target zone identification.
     * @returns {Promise<Object>} Exploration properties.
     */
    async startExpedition(username, zoneKey) {
        throw new Error("Method 'startExpedition()' must be implemented.");
    }

    /**
     * Automatically evaluates and collects idle completed items.
     * @returns {Promise<any[]>}
     */
    async processFinishedExpeditions() {
        throw new Error("Method 'processFinishedExpeditions()' must be implemented.");
    }
}

/**
 * Market, Direct Trades and Auction House orchestrator contract.
 * @abstract
 */
export class IMarketService {
    /**
     * Publishes auction items, subtracting resources from seller backpack.
     * @param {string} sellerName - Seller username.
     * @param {string} itemName - Target material name.
     * @param {number} amount - Quantity.
     * @param {number} price - Total requested price.
     * @returns {Promise<AuctionItem>}
     */
    async publishAuction(sellerName, itemName, amount, price) {
        throw new Error("Method 'publishAuction()' must be implemented.");
    }

    /**
     * Buys an auction listing inside a safe ACID database transaction.
     * @param {string} buyerName - Buyer username.
     * @param {string} auctionId - Auction listing UUID.
     * @returns {Promise<AuctionItem>}
     */
    async buyAuction(buyerName, auctionId) {
        throw new Error("Method 'buyAuction()' must be implemented.");
    }

    /**
     * Retrieves all active non-expired auctions.
     * @returns {Promise<AuctionItem[]>}
     */
    async getActiveAuctions() {
        throw new Error("Method 'getActiveAuctions()' must be implemented.");
    }

    /**
     * Checks and returns expired active auctions back to seller inventories.
     * @returns {Promise<void>}
     */
    async checkExpiredAuctions() {
        throw new Error("Method 'checkExpiredAuctions()' must be implemented.");
    }

    /**
     * Proposes a direct trade.
     * @param {string} senderName - Proposing username.
     * @param {string} targetName - Target recipient username.
     * @param {string} sendItem - Material offered.
     * @param {number} sendAmount - Quantity offered.
     * @param {string} reqItem - Material requested.
     * @param {number} reqAmount - Quantity requested.
     * @returns {Promise<{sItemActual: string, rItemActual: string}>}
     */
    async proposeTrade(senderName, targetName, sendItem, sendAmount, reqItem, reqAmount) {
        throw new Error("Method 'proposeTrade()' must be implemented.");
    }

    /**
     * Finalizes direct trade structures.
     * @param {string} targetName - Target buyer.
     * @param {boolean} accept - Outcome option.
     * @returns {Promise<Object|boolean>} Settled properties, yields false if rejected.
     */
    async resolveTrade(targetName, accept) {
        throw new Error("Method 'resolveTrade()' must be implemented.");
    }
}

/**
 * Real-time World Boss engine contract.
 * @abstract
 */
export class IRaidService {
    /**
     * Broadcasts raid commencement to the WS hub.
     * @param {ISocketServer} io - Sockets server instance.
     * @returns {Promise<void>}
     */
    async startRaid(io) {
        throw new Error("Method 'startRaid()' must be implemented.");
    }

    /**
     * Deducts boss HP and registers live damage log metrics.
     * @param {string} username - Attacking username.
     * @param {ISocketServer} io - Sockets server instance.
     * @returns {Promise<void>}
     */
    async hitBoss(username, io) {
        throw new Error("Method 'hitBoss()' must be implemented.");
    }

    /**
     * Syncs incoming live players with current session metrics.
     * @returns {Object|null}
     */
    getSyncData() {
        throw new Error("Method 'getSyncData()' must be implemented.");
    }
}

/**
 * Filters incoming messages in Socket.io threads contract.
 * @abstract
 */
export class IChatFilterService {
    /**
     * Processes a message through all registered filters.
     * @param {string} msg - The raw message content.
     * @param {string} username - The sender's username.
     * @param {ISocketServer} io - The socket.io server instance.
     * @param {number} timestamp - The message timestamp.
     * @returns {Promise<void>}
     */
    async processMessage(msg, username, io, timestamp) {
        throw new Error("Method 'processMessage()' must be implemented.");
    }

    /**
     * Processes a message through all registered filters.
     * @param {string} msg - The raw message content.
     * @param {string} username - The sender's username.
     * @param {ISocketServer} io - The socket.io server instance.
     * @param {number} timestamp - The message timestamp.
     * @returns {Promise<void>}
     */
    async checkDonationSpam(msg, username, io, timestamp) {
        throw new Error("Method 'checkDonationSpam()' must be implemented.");
    }
}