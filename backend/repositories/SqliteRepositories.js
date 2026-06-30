import { Wallet } from '../domain/economy/Wallet.js';
import { BaseSqliteRepository } from '../core/repositories/BaseSqliteRepository.js';
import { Inventory } from '../domain/rpg/Inventory.js';


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
 * @extends {BaseSqliteRepository<import('../domain/economy/Wallet.js').Wallet>}
 * @implements {IEconomyRepository}
 */
export class SqliteEconomyRepository extends BaseSqliteRepository {
    /**
     * @param {import('../core/types.js').IDatabaseClient} client
     */
    constructor(client) { super(client, "economy"); }

    /**
     * @param {any[]} rows
     */
    mapToDomain(rows) { return rows.map((r) => new Wallet(r)); }

    /**
     * @param {import('../core/types.js').ISqlConnection} db
     * @param {Wallet[]} wallets 
     */
    async saveAll(db, wallets) {
        for (const w of wallets) {
            await db.run('INSERT OR REPLACE INTO economy (name, money, debt) VALUES (?, ?, ?)', [w.name, w.money, w.debt]);
        }
    }

    /**
     * @param {Wallet[]} wallets
     * @param {string} username
     */
    ensureWallet(wallets, username) {
        let wallet = wallets.find((w) => w.name === username);
        if (!wallet) {
            wallet = new Wallet({name: username, money: 100, debt: 0});
            wallets.push(wallet);
        }
        return wallet;
    }
}
/**
 * @typedef {import('../core/types.js').IGamblingRepository} IGamblingRepository
 * @typedef {import('../core/types.js').Gambler} Gambler
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
     * @param {any} rows
     */
    mapToDomain(rows) { return rows; }

    /**
     * @param {import('../core/types.js').ISqlConnection} db
     * @param {Gambler[]} users 
     */
    async saveAll(db, users) {
        for (const u of users) {
            await db.run(
                `INSERT OR REPLACE INTO gambling (name, totalEarnings, spend, timesSteal, moneySteal, duelWin, duelLose, bankRupt, lastRobbery, lastDaily, dailyStreak) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [u.name, u.totalEarnings, u.spend, u.timesSteal, u.moneySteal, u.duelWin, u.duelLose, u.bankRupt, u.lastRobbery, u.lastDaily, u.dailyStreak]
            );
        }
    }

    /**
     * @param {Gambler[]} users
     * @param {string} username
     */
    ensureUser(users, username) {
        let user = users.find(u => u.name === username);
        if (!user) {
            user = { name: username, totalEarnings: 0, spend: 0, timesSteal: 0, moneySteal: 0, duelWin: 0, duelLose: 0, bankRupt: 0, lastRobbery: 0, lastDaily: 0, dailyStreak: 0 };
            users.push(user);
        }
        return user;
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
            await db.run('INSERT OR REPLACE INTO inventory (name, items) VALUES (?, ?)', [inv.name, JSON.stringify(inv.items)]);
        }
    }

    /**
     * @param {string} username
     */
    async getInventory(username) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT * FROM inventory WHERE name = ?', [username]);
        if (row) return new Inventory({ name: row.name, items: JSON.parse(row.items) });
        return new Inventory({ name: username, items: {} });
    }
    /**
     * @param {Inventory[]} inventories
     * @param {string} username
     */
    ensureInventory(inventories, username) {
        let inv = inventories.find(i => i.name === username);
        if (!inv) { inv = new Inventory({ name: username, items: {} }); inventories.push(inv); }
        return inv;
    }
}

/**
 * @typedef {import('../core/types.js').JobProfile} JobProfile
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
        return rows.map(r => ({ ...r, activeBuffs: JSON.parse(r.activeBuffs), activeExpedition: JSON.parse(r.activeExpedition) })); 
    }

    /**
     * @param {import('../core/types.js').ISqlConnection} db
     * @param {JobProfile[]} jobs 
     */
    async saveAll(db, jobs) {
        for (const j of jobs) {
            await db.run('INSERT OR REPLACE INTO jobs (name, job, toolLevel, lastWork, activeBuffs, prestigeLevel, activeExpedition) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [j.name, j.job, j.toolLevel, j.lastWork, JSON.stringify(j.activeBuffs), j.prestigeLevel || 0, JSON.stringify(j.activeExpedition)]);
        }
    }

    /**
     * @param {string} username
     * @returns {Promise<JobProfile|undefined>}
     */
    async getProfile(username) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT * FROM jobs WHERE name = ?', [username]);
        if (row) return { ...row, activeBuffs: JSON.parse(row.activeBuffs), activeExpedition: JSON.parse(row.activeExpedition) };
        return undefined;
    }
    /**
     * @param {any[]} jobs
     * @param {string} username
     */
    ensureJobProfile(jobs, username) {
        let p = jobs.find(j => j.name === username);
        if (!p) { p = { name: username, job: null, toolLevel: 1, lastWork: 0, activeBuffs: {}, activeExpedition: null }; jobs.push(p); }
        if (!p.activeBuffs) p.activeBuffs = {};
        if (p.activeExpedition === undefined) p.activeExpedition = null;
        return p;
    }
}

/**
 * @typedef {import('../core/types.js').PetProfile} PetProfile
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
     * @param {any} rows
     * @returns {PetProfile[]}
     */
    mapToDomain(rows) { 
        return rows.map((/** @type {{ name: any; eggs: any; pets: any; equipped: any; }} */ r) => ({ name: r.name, eggs: r.eggs, pets: r.pets, equipped: r.equipped })); 
    }

    /**
     * @param {import('../core/types.js').ISqlConnection} db
     * @param {PetProfile[]} profiles 
     */
    async saveAll(db, profiles) {
        for (const p of profiles) {
            await db.run('INSERT OR REPLACE INTO pets (name, eggs, pets, equipped) VALUES (?, ?, ?, ?)', [p.name, p.eggs, JSON.stringify(p.pets), p.equipped]);
        }
    }

    /**
     * @param {string} username
     * @returns {Promise<PetProfile>}
     */
    async getProfile(username) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT * FROM pets WHERE name = ?', [username]);
        if (row) return { name: row.name, eggs: row.eggs, pets: JSON.parse(row.pets), equipped: row.equipped };
        return { name: username, eggs: 0, pets: [], equipped: null };
    }
    /**
     * @param {PetProfile[]} profiles
     * @param {string} username
     */
    ensureProfile(profiles, username) {
        let p = profiles.find(p => p.name === username);
        if (!p) { p = { name: username, eggs: 0, pets: [], equipped: null }; profiles.push(p); }
        return p;
    }
}

/**
 * @typedef {import('../core/types.js').GuildProps} GuildProps
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
        return rows.map(r => ({ ...r, members: JSON.parse(r.members) })); 
    }

    /**
     * @param {import('../core/types.js').ISqlConnection} db
     * @param {GuildProps[]} guilds 
     */
    async saveAll(db, guilds) {
        await db.run('DELETE FROM guilds');
        for (const g of guilds) {
            await db.run('INSERT INTO guilds (id, name, level, bankMoney, members) VALUES (?, ?, ?, ?, ?)', [g.id, g.name, g.level, g.bankMoney, JSON.stringify(g.members)]);
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
     * @param {import('../core/types.js').ISqlConnection} db
     * @param {AuctionItem[]} auctions 
     */
    async saveAll(db, auctions) {
        await db.run('DELETE FROM auctions');
        for (const a of auctions) {
            await db.run('INSERT INTO auctions (id, seller, itemName, amount, price, expiresAt) VALUES (?, ?, ?, ?, ?, ?)', [a.id, a.seller, a.itemName, a.amount, a.price, a.expiresAt]);
        }
    }
    /**
     * @param {string} id
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