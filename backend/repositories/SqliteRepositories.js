import { Wallet } from '../domain/economy/Wallet.js';
import { BaseSqliteRepository } from '../core/repositories/BaseSqliteRepository.js';
import { Inventory } from '../domain/rpg/Inventory.js';
import { JobProfile } from '../domain/rpg/JobProfile.js';
import { PetProfile } from '../domain/rpg/PetProfile.js';
import { Guild } from '../domain/guild/Guild.js';
import { Gambler } from '../domain/gambling/Gambler.js';


/**
 * @typedef {import('../core/types.js').IUserRepository} IUserRepository
 * @typedef {import('../core/types.js').User} User
 * @typedef {import('../core/types.js').IDatabaseClient} IDatabaseClient
 */

/**
 * @implements {IUserRepository}
 */
export class SqliteUserRepository {
    /**
     * @param {IDatabaseClient} client
     */
    constructor(client) { this.client = client; }
    /**
     * Retrieves all users.
     * @returns {Promise<User[]>}
     */
    async findAll() {
        const db = await this.client.getDb();
        const rows = await db.all('SELECT * FROM users');
        return rows.map((/** @type {{ roles: string; }} */ r) => ({...r, roles: JSON.parse(r.roles)}));
    }
    /**
     * Searches a user by name.
     * @param {string} name - The username to search.
     * @returns {Promise<User|undefined>}
     */
    async findByName(name) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT * FROM users WHERE name = ?', [name]);
        if (!row) return undefined;
        return {...row, roles: JSON.parse(row.roles)};
    }
    /**
     * Persists or updates a user profile.
     * @param {User} user - The user entity to save.
     * @returns {Promise<void>}
     */
    async save(user) {
        const db = await this.client.getDb();
        await db.run(
            'INSERT OR REPLACE INTO users (name, passwd, location, roles, color, img) VALUES (?, ?, ?, ?, ?, ?)',
            [user.name, user.passwd, user.location, JSON.stringify(user.roles), user.color, user.img]
        );
    }

    /**
     * Deletes a user profile by name.
     * @param {string} name - Username to delete.
     * @returns {Promise<void>}
     */
    async deleteByName(name) {
        const db = await this.client.getDb();
        await db.run('DELETE FROM users WHERE name = ?', [name]);
    }
}

/**
 * @typedef {import('../core/types.js').IEconomyRepository} IEconomyRepository
 */
/**
 * Granular economy data operations over SQLite database.
 * @extends {BaseSqliteRepository<Wallet>}
 */
export class SqliteEconomyRepository extends BaseSqliteRepository {
    /**
     * @param {import('../core/types.js').IDatabaseClient} client
     */
    constructor(client) { super(client, "economy"); }

    /**
     * Maps raw DB records into Wallet instances.
     * @param {any[]} rows - SQL DB raw rows.
     * @returns {Wallet[]}
     */
    mapToDomain(rows) { return rows.map((r) => new Wallet(r)); }

    /**
     * Default Wallet creation.
     * @protected
     * @param {string} username - Target owner.
     * @returns {Wallet}
     */
    createDefault(username) {
        return new Wallet({ name: username, money: 100, debt: 0 });
    }

    /**
     * Finds a single player wallet by username.
     * @param {string} name - Username.
     * @returns {Promise<Wallet|null>} Target wallet entity, or null.
     */
    async findById(name) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT * FROM economy WHERE name = ?', [name]);
        if (!row) return null;
        return new Wallet({
            name: row.name,
            money: row.money,
            debt: row.debt
        });
    }

    /**
     * Inserts or replaces a single wallet instance inside a transaction.
     * @protected
     * @param {import('../core/types.js').ISqlConnection} db - SQL Connection.
     * @param {Wallet} wallet - Domain Wallet instance.
     * @returns {Promise<void>}
     */
    async saveSingle(db, wallet) {
        await db.run(
            'INSERT OR REPLACE INTO economy (name, money, debt) VALUES (?, ?, ?)', 
            [wallet.name, wallet.money, wallet.debt]
        );
    }

    /**
     * Legacy transaction mechanism for full table updates.
     * @param {import('../core/types.js').ISqlConnection} db
     * @param {Wallet[]} wallets 
     */
    async saveAll(db, wallets) {
        for (const w of wallets) {
            await this.saveSingle(db, w);
        }
    }
}
/**
 * @typedef {import('../core/types.js').IGamblingRepository} IGamblingRepository
 */

/**
 * @extends {BaseSqliteRepository<Gambler>}
 * @implements {IGamblingRepository}
 */
export class SqliteGamblingRepository extends BaseSqliteRepository {
    /**
     * @param {IDatabaseClient} client
     */
    constructor(client) { super(client, "gambling"); }

    /**
     * @param {any[]} rows
     */
    mapToDomain(rows) { 
        return rows.map(r => new Gambler(r)); 
    }

    /**
     * Default Gambler creation.
     * @protected
     * @param {string} username - Target owner.
     * @returns {Gambler}
     */
    createDefault(username) {
        return new Gambler({ 
            name: username, 
            totalEarnings: 0, 
            spend: 0, 
            timesSteal: 0, 
            moneySteal: 0, 
            duelWin: 0, 
            duelLose: 0, 
            bankRupt: 0, 
            lastRobbery: 0, 
            lastDaily: 0, 
            dailyStreak: 0 
        });
    }
    
    /**
     * Finds a single player gambling profile by username.
     * @param {string} name - Username.
     * @returns {Promise<Gambler|null>} Target gambler entity, or null.
     */
    async findById(name) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT * FROM gambling WHERE name = ?', [name]);
        if (!row) return null;
        return new Gambler(row);
    }

    /**
     * Inserts or replaces a single gambler instance inside a transaction.
     * @protected
     * @param {import('../core/types.js').ISqlConnection} db - SQL Connection.
     * @param {Gambler} u - Domain Gambler instance.
     * @returns {Promise<void>}
     */
    async saveSingle(db, u) {
        await db.run(
            `INSERT OR REPLACE INTO gambling (name, totalEarnings, spend, timesSteal, moneySteal, duelWin, duelLose, bankRupt, lastRobbery, lastDaily, dailyStreak) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [u.name, u.totalEarnings, u.spend, u.timesSteal, u.moneySteal, u.duelWin, u.duelLose, u.bankRupt, u.lastRobbery, u.lastDaily, u.dailyStreak]
        );
    }

    /**
     * Legacy transaction mechanism for full table updates.
     * @param {import('../core/types.js').ISqlConnection} db
     * @param {Gambler[]} users 
     */
    async saveAll(db, users) {
        for (const u of users) {
            await this.saveSingle(db, u);
        }
    }
}

/**
 * @typedef {import('../core/types.js').IInventoryRepository} IInventoryRepository
 */

/**
 * @extends {BaseSqliteRepository<Inventory>}
 * @implements {IInventoryRepository}
 */
export class SqliteInventoryRepository extends BaseSqliteRepository {
    /**
     * @param {IDatabaseClient} client
     */
    constructor(client) { super(client, "inventory"); }

    /**
     * @param {any[]} rows
     */
    mapToDomain(rows) { return rows.map(r => new Inventory({ name: r.name, items: JSON.parse(r.items) })); }

    /**
     * @param {import('../core/types.js').ISqlConnection} db
     * @param {Inventory[]} inventories 
     */
    async saveAll(db, inventories) {
        for (const inv of inventories) {
            await this.saveSingle(db, inv);
        }
    }

    /**
     * Saves a single inventory row.
     * @protected
     * @param {import('../core/types.js').ISqlConnection} db - SQL Connection.
     * @param {Inventory} inv - Domain instance.
     * @returns {Promise<void>}
     */
    async saveSingle(db, inv) {
        await db.run('INSERT OR REPLACE INTO inventory (name, items) VALUES (?, ?)', [inv.name, JSON.stringify(inv.items)]);
    }

    /**
     * @param {string} username
     */
    async getInventory(username) {
        const inventory = await this.findById(username);
        return inventory || this.createDefault(username);
    }
    /**
     * @protected
     * @param {string} username - Target owner.
     * @returns {Inventory}
     */
    createDefault(username) {
        return new Inventory({ name: username, items: {} });
    }
    /**
     * Finds a single inventory record.
     * @param {string} username - The username identifier.
     * @returns {Promise<Inventory|null>}
     */
    async findById(username) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT * FROM inventory WHERE name = ?', [username]);
        if (!row) return null;
        return new Inventory({ name: row.name, items: JSON.parse(row.items) });
    }
}

/**
 * @typedef {import('../core/types.js').IJobRepository} IJobRepository
 */

/**
 * @extends {BaseSqliteRepository<JobProfile>}
 * @implements {IJobRepository}
 */
export class SqliteJobRepository extends BaseSqliteRepository {
    /**
     * @param {IDatabaseClient} client
     */
    constructor(client) { super(client, "jobs"); }

    /**
     * @param {any[]} rows
     * @returns {JobProfile[]}
     */
    mapToDomain(rows) { 
        return rows.map(r => new JobProfile({ 
            name: r.name, 
            job: r.job, 
            toolLevel: r.toolLevel, 
            lastWork: r.lastWork, 
            activeBuffs: JSON.parse(r.activeBuffs || '{}'), 
            prestigeLevel: r.prestigeLevel || 0, 
            activeExpedition: JSON.parse(r.activeExpedition || 'null')
        })); 
    }

    /**
     * Default JobProfile creation.
     * @protected
     * @param {string} username - Target owner.
     * @returns {JobProfile}
     */
    createDefault(username) {
        return new JobProfile({ 
            name: username, 
            job: null, 
            toolLevel: 1, 
            lastWork: 0, 
            activeBuffs: {}, 
            prestigeLevel: 0, 
            activeExpedition: null 
        }); 
    }

    /**
     * Finds a single job profile record.
     * @param {string} username - Target identifier.
     * @returns {Promise<JobProfile|null>}
     */
    async findById(username) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT * FROM jobs WHERE name = ?', [username]);
        if (!row) return null;
        return new JobProfile({ 
            name: row.name, 
            job: row.job, 
            toolLevel: row.toolLevel, 
            lastWork: row.lastWork, 
            activeBuffs: JSON.parse(row.activeBuffs || '{}'), 
            prestigeLevel: row.prestigeLevel || 0, 
            activeExpedition: JSON.parse(row.activeExpedition || 'null') 
        });
    }

    /**
     * Saves a single job profile row.
     * @protected
     * @param {import('../core/types.js').ISqlConnection} db - SQL Connection.
     * @param {JobProfile} j - Domain instance.
     * @returns {Promise<void>}
     */
    async saveSingle(db, j) {
        await db.run(
            'INSERT OR REPLACE INTO jobs (name, job, toolLevel, lastWork, activeBuffs, prestigeLevel, activeExpedition) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [j.name, j.job, j.toolLevel, j.lastWork, JSON.stringify(j.activeBuffs), j.prestigeLevel || 0, JSON.stringify(j.activeExpedition)]
        );
    }

    /**
     * @param {import('../core/types.js').ISqlConnection} db
     * @param {JobProfile[]} jobs 
     */
    async saveAll(db, jobs) {
        for (const j of jobs) {
            await this.saveSingle(db, j);
        }
    }

    /**
     * @param {string} username
     * @returns {Promise<JobProfile|undefined>}
     */
    async getProfile(username) {
        const profile = await this.findById(username);
        return profile || undefined;
    }
}

/**
 * @typedef {import('../core/types.js').IPetRepository} IPetRepository
 */

/**
 * @extends {BaseSqliteRepository<PetProfile>}
 * @implements {IPetRepository}
 */
export class SqlitePetRepository extends BaseSqliteRepository {
    /**
     * @param {IDatabaseClient} client
     */
    constructor(client) { super(client, "pets"); }

    /**
     * @param {any[]} rows
     * @returns {PetProfile[]}
     */
    mapToDomain(rows) { 
        return rows.map(r => new PetProfile({ 
            name: r.name, 
            eggs: r.eggs, 
            pets: JSON.parse(r.pets || '[]'), 
            equipped: r.equipped 
        })); 
    }

    /**
     * Default PetProfile creation.
     * @protected
     * @param {string} username - Target owner.
     * @returns {PetProfile}
     */
    createDefault(username) {
        return new PetProfile({ name: username, eggs: 0, pets: [], equipped: null });
    }

    /**
     * Finds a single player companion profile by username.
     * @param {string} username - Username.
     * @returns {Promise<PetProfile|null>} Target pet profile entity, or null.
     */
    async findById(username) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT * FROM pets WHERE name = ?', [username]);
        if (!row) return null;
        return new PetProfile({ 
            name: row.name, 
            eggs: row.eggs, 
            pets: JSON.parse(row.pets || '[]'), 
            equipped: row.equipped 
        });
    }

    /**
     * @param {string} username - Username.
     * @returns {Promise<PetProfile>}
     */
    async getProfile(username) {
        const profile = await this.findById(username);
        return profile || this.createDefault(username);
    }

    /**
     * Inserts or replaces a single pet profile instance inside a transaction.
     * @protected
     * @param {import('../core/types.js').ISqlConnection} db - SQL Connection.
     * @param {PetProfile} p - Domain companion instance.
     * @returns {Promise<void>}
     */
    async saveSingle(db, p) {
        await db.run('INSERT OR REPLACE INTO pets (name, eggs, pets, equipped) VALUES (?, ?, ?, ?)', [p.name, p.eggs, JSON.stringify(p.pets), p.equipped]);
    }

    /**
     * Legacy transaction mechanism for full table updates.
     * @param {import('../core/types.js').ISqlConnection} db
     * @param {PetProfile[]} profiles 
     */
    async saveAll(db, profiles) {
        for (const p of profiles) {
            await this.saveSingle(db, p);
        }
    }
}

/**
 * @typedef {import('../core/types.js').Guild} GuildProps
 * @typedef {import('../core/types.js').IGuildRepository} IGuildRepository
 */

/**
 * @extends {BaseSqliteRepository<GuildProps>}
 * @implements {IGuildRepository}
 */
export class SqliteGuildRepository extends BaseSqliteRepository {
    /**
     * @param {IDatabaseClient} client
     */
    constructor(client) { super(client, "guilds"); }

    /**
     * @param {any[]} rows
     * @returns {GuildProps[]}
     */
    mapToDomain(rows) { 
        return rows.map(r => new Guild({ 
            id: r.id, 
            name: r.name, 
            level: r.level, 
            bankMoney: r.bankMoney, 
            members: JSON.parse(r.members || '[]') 
        })); 
    }

    /**
     * Default Guild creation.
     * @protected
     * @param {string} id - Guild unique ID.
     * @returns {Guild}
     */
    createDefault(id) {
        return new Guild({ id, name: "Placeholder", level: 1, bankMoney: 0, members: [] });
    }

    /**
     * Finds a single guild by ID.
     * @param {string} id - Guild ID.
     * @returns {Promise<Guild|null>} Target guild entity, or null.
     */
    async findById(id) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT * FROM guilds WHERE id = ?', [id]);
        if (!row) return null;
        return new Guild({
            id: row.id,
            name: row.name,
            level: row.level,
            bankMoney: row.bankMoney,
            members: JSON.parse(row.members || '[]')
        });
    }

    /**
     * Inserts or replaces a single guild instance inside a transaction.
     * @protected
     * @param {import('../core/types.js').ISqlConnection} db - SQL Connection.
     * @param {Guild} g - Domain guild instance.
     * @returns {Promise<void>}
     */
    async saveSingle(db, g) {
        await db.run('INSERT OR REPLACE INTO guilds (id, name, level, bankMoney, members) VALUES (?, ?, ?, ?, ?)', [g.id, g.name, g.level, g.bankMoney, JSON.stringify(g.members)]);
    }

    /**
     * Legacy transaction mechanism for full table updates.
     * @param {import('../core/types.js').ISqlConnection} db
     * @param {Guild[]} guilds 
     */
    async saveAll(db, guilds) {
        await db.run('DELETE FROM guilds');
        for (const g of guilds) {
            await this.saveSingle(db, g);
        }
    }
}

/**
 * @typedef {import('../core/types.js').AuctionItem} AuctionItem
 * @typedef {import('../core/types.js').IAuctionRepository} IAuctionRepository
 */

/**
 * @extends {BaseSqliteRepository<AuctionItem>}
 * @implements {IAuctionRepository}
 */
export class SqliteAuctionRepository extends BaseSqliteRepository {
    /**
     * @param {IDatabaseClient} client
     */
    constructor(client) { super(client, "auctions"); }

    /**
     * @param {any} rows
     */
    mapToDomain(rows) { return rows; }

    /**
     * Default AuctionItem creation.
     * @protected
     * @param {string} id - Auction ID.
     * @returns {AuctionItem}
     */
    createDefault(id) {
        return { id, seller: "System", itemName: "Trash", amount: 1, price: 9999, expiresAt: Date.now() };
    }

    /**
     * Finds a single active auction by ID.
     * @param {string} id - Auction ID.
     * @returns {Promise<AuctionItem|null>} Target auction entity, or null.
     */
    async findById(id) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT * FROM auctions WHERE id = ?', [id]);
        if (!row) return null;
        return row;
    }

    /**
     * Inserts or replaces a single auction instance inside a transaction.
     * @protected
     * @param {import('../core/types.js').ISqlConnection} db - SQL Connection.
     * @param {AuctionItem} a - Domain companion instance.
     * @returns {Promise<void>}
     */
    async saveSingle(db, a) {
        await db.run('INSERT OR REPLACE INTO auctions (id, seller, itemName, amount, price, expiresAt) VALUES (?, ?, ?, ?, ?, ?)', [a.id, a.seller, a.itemName, a.amount, a.price, a.expiresAt]);
    }

    /**
     * Legacy transaction mechanism for full table updates.
     * @param {import('../core/types.js').ISqlConnection} db
     * @param {AuctionItem[]} auctions 
     */
    async saveAll(db, auctions) {
        await db.run('DELETE FROM auctions');
        for (const a of auctions) {
            await this.saveSingle(db, a);
        }
    }

    /**
     * @param {string} id - Auction unique ID.
     * @returns {Promise<boolean>}
     */
    async removeAuction(id) {
        const db = await this.client.getDb();
        const result = await db.run('DELETE FROM auctions WHERE id = ?', [id]);
        return result.changes > 0;
    }
}

/**
 * @typedef {import('../core/types.js').MessageProps} MessageProps
 * @typedef {import('../core/types.js').IMessageRepository} IMessageRepository
 */

/**
 * @implements {IMessageRepository}
 */
export class SqliteMessageRepository {
    /**
     * @param {IDatabaseClient} client
     */
    constructor(client) { this.client = client; }
    /**
     * 
     * @returns {Promise<MessageProps[]>}
     */
    async getAll() {
        const db = await this.client.getDb();
        const rows = await db.all('SELECT * FROM messages ORDER BY timestamp ASC');
        return rows.map((/** @type {{ edited: number; emojis: string; reply: string; }} */ r) => ({ ...r, edited: r.edited === 1, emojis: JSON.parse(r.emojis), reply: JSON.parse(r.reply) }));
    }
    /**
     * @param {MessageProps} msg
     */
    async saveMessage(msg) {
        const db = await this.client.getDb();
        await db.run('INSERT INTO messages (id, user, message, timestamp, edited, prestige, emojis, reply) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [msg.id, msg.user, msg.message, msg.timestamp, msg.edited ? 1 : 0, msg.prestige || 0, JSON.stringify(msg.emojis || []), JSON.stringify(msg.reply || null)]);
    }
    /**
     * @param {string} id
     * @param {string} username
     * @param {string} newText
     */
    async editMessage(id, username, newText) {
        const db = await this.client.getDb();
        await db.run('UPDATE messages SET message = ?, edited = 1 WHERE id = ? AND user = ?', [newText, id, username]);
    }
    /**
     * @param {string} id
     * @param {string} username
     */
    async deleteMessage(id, username) {
        const db = await this.client.getDb();
        await db.run('DELETE FROM messages WHERE id = ? AND user = ?', [id, username]);
    }
    /**
     * @param {string} messageId
     * @param {string} emojiName
     * @param {string} username
     */
    async addReaction(messageId, emojiName, username) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT emojis FROM messages WHERE id = ?', [messageId]);
        if (!row) return;
        const emojis = JSON.parse(row.emojis || '[]');
        let entry = emojis.find((/** @type {{ name: any; }} */ e) => e.name === emojiName);
        if (!entry) { entry = { name: emojiName, users: [] }; emojis.push(entry); }
        if (!entry.users.includes(username)) { entry.users.push(username); }
        await db.run('UPDATE messages SET emojis = ? WHERE id = ?', [JSON.stringify(emojis), messageId]);
    }
}

/**
 * @typedef {import('../core/types.js').IBannedIpRepository} IBannedIpRepository
 */

/**
 * @implements {IBannedIpRepository}
 */
export class SqliteBannedIpRepository {
    /**
     * @param {IDatabaseClient} client
     */
    constructor(client) { this.client = client; }
    /**
     * @param {string} ip
     */
    async isBanned(ip) {
        const db = await this.client.getDb();
        return await db.get('SELECT * FROM banned_ips WHERE ip = ?', [ip]);
    }
}