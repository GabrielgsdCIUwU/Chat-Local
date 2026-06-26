import { Wallet } from '../domain/economy/Wallet.js';
import { BaseSqliteRepository } from '../core/repositories/BaseSqliteRepository.js';

export class SqliteUserRepository {
    constructor(client) { this.client = client; }
    async findAll() {
        const db = await this.client.getDb();
        const rows = await db.all('SELECT * FROM users');
        return rows.map(r => ({...r, roles: JSON.parse(r.roles)}));
    }
    async findByName(name) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT * FROM users WHERE name = ?', [name]);
        if (!row) return undefined;
        return {...row, roles: JSON.parse(row.roles)};
    }
    async save(user) {
        const db = await this.client.getDb();
        await db.run(
            'INSERT OR REPLACE INTO users (name, passwd, location, roles, color, img) VALUES (?, ?, ?, ?, ?, ?)',
            [user.name, user.passwd, user.location, JSON.stringify(user.roles), user.color, user.img]
        );
    }
}

export class SqliteEconomyRepository extends BaseSqliteRepository {
    constructor(client) { super(client, "economy"); }

    mapToDomain(rows) { return rows.map(r => new Wallet(r)); }

    async saveAll(db, wallets) {
        for (const w of wallets) {
            await db.run('INSERT OR REPLACE INTO economy (name, money, debt) VALUES (?, ?, ?)', [w.name, w.money, w.debt]);
        }
    }

    ensureWallet(wallets, username) {
        let wallet = wallets.find(w => w.name === username);
        if (!wallet) {
            wallet = new Wallet({name: username, money: 100, debt: 0});
            wallet.push(wallet);
        }
        return wallet;
    }
}

export class SqliteGamblingRepository extends BaseSqliteRepository {
    constructor(client) { super(client, "gambling"); }

    mapToDomain(rows) { return rows; }

    async saveAll(db, users) {
        for (const u of users) {
            await db.run(
                `INSERT OR REPLACE INTO gambling (name, totalEarnings, spend, timesSteal, moneySteal, duelWin, duelLose, bankRupt, lastRobbery, lastDaily, dailyStreak) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [u.name, u.totalEarnings, u.spend, u.timesSteal, u.moneySteal, u.duelWin, u.duelLose, u.bankRupt, u.lastRobbery, u.lastDaily, u.dailyStreak]
            );
        }
    }

    ensureUser(users, username) {
        let user = users.find(u => u.name === username);
        if (!user) {
            user = { name: username, totalEarnings: 0, spend: 0, timesSteal: 0, moneySteal: 0, duelWin: 0, duelLose: 0, bankRupt: 0, lastRobbery: 0, lastDaily: 0, dailyStreak: 0 };
            users.push(user);
        }
        return user;
    }
}

export class SqliteInventoryRepository extends BaseSqliteRepository {
    constructor(client) { super(client, "inventory"); }

    mapToDomain(rows) { return rows.map(r => ({ name: r.name, items: JSON.parse(r.items) })); }

    async saveAll(db, inventories) {
        for (const inv of inventories) {
            await db.run('INSERT OR REPLACE INTO inventory (name, items) VALUES (?, ?)', [inv.name, JSON.stringify(inv.items)]);
        }
    }

    async getInventory(username) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT * FROM inventory WHERE name = ?', [username]);
        if (row) return { name: row.name, items: JSON.parse(row.items) };
        return { name: username, items: {} };
    }
    ensureInventory(inventories, username) {
        let inv = inventories.find(i => i.name === username);
        if (!inv) { inv = { name: username, items: {} }; inventories.push(inv); }
        return inv;
    }
}

export class SqliteJobRepository extends BaseSqliteRepository {
    constructor(client) { super(client, "jobs"); }

    mapToDomain(rows) { 
        return rows.map(r => ({ ...r, activeBuffs: JSON.parse(r.activeBuffs), activeExpedition: JSON.parse(r.activeExpedition) })); 
    }

    async saveAll(db, jobs) {
        for (const j of jobs) {
            await db.run('INSERT OR REPLACE INTO jobs (name, job, toolLevel, lastWork, activeBuffs, prestigeLevel, activeExpedition) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [j.name, j.job, j.toolLevel, j.lastWork, JSON.stringify(j.activeBuffs), j.prestigeLevel || 0, JSON.stringify(j.activeExpedition)]);
        }
    }

    async getProfile(username) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT * FROM jobs WHERE name = ?', [username]);
        if (row) return { ...row, activeBuffs: JSON.parse(row.activeBuffs), activeExpedition: JSON.parse(row.activeExpedition) };
        return undefined;
    }
    ensureJobProfile(jobs, username) {
        let p = jobs.find(j => j.name === username);
        if (!p) { p = { name: username, job: null, toolLevel: 1, lastWork: 0, activeBuffs: {}, activeExpedition: null }; jobs.push(p); }
        if (!p.activeBuffs) p.activeBuffs = {};
        if (p.activeExpedition === undefined) p.activeExpedition = null;
        return p;
    }
}

export class SqlitePetRepository extends BaseSqliteRepository {
    constructor(client) { super(client, "pets"); }

    mapToDomain(rows) { 
        return rows.map(r => ({ name: r.name, eggs: r.eggs, pets: JSON.parse(r.pets), equipped: r.equipped })); 
    }

    async saveAll(db, profiles) {
        for (const p of profiles) {
            await db.run('INSERT OR REPLACE INTO pets (name, eggs, pets, equipped) VALUES (?, ?, ?, ?)', [p.name, p.eggs, JSON.stringify(p.pets), p.equipped]);
        }
    }

    async getProfile(username) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT * FROM pets WHERE name = ?', [username]);
        if (row) return { name: row.name, eggs: row.eggs, pets: JSON.parse(row.pets), equipped: row.equipped };
        return { name: username, eggs: 0, pets: [], equipped: null };
    }
    ensureProfile(profiles, username) {
        let p = profiles.find(p => p.name === username);
        if (!p) { p = { name: username, eggs: 0, pets: [], equipped: null }; profiles.push(p); }
        return p;
    }
}

export class SqliteGuildRepository extends BaseSqliteRepository {
    constructor(client) { super(client, "guilds"); }

    mapToDomain(rows) { 
        return rows.map(r => ({ ...r, members: JSON.parse(r.members) })); 
    }

    async saveAll(db, guilds) {
        await db.run('DELETE FROM guilds');
        for (const g of guilds) {
            await db.run('INSERT INTO guilds (id, name, level, bankMoney, members) VALUES (?, ?, ?, ?, ?)', [g.id, g.name, g.level, g.bankMoney, JSON.stringify(g.members)]);
        }
    }
}

export class SqliteAuctionRepository extends BaseSqliteRepository {
    constructor(client) { super(client, "auctions"); }

    mapToDomain(rows) { return rows; }

    async saveAll(db, auctions) {
        await db.run('DELETE FROM auctions');
        for (const a of auctions) {
            await db.run('INSERT INTO auctions (id, seller, itemName, amount, price, expiresAt) VALUES (?, ?, ?, ?, ?, ?)', [a.id, a.seller, a.itemName, a.amount, a.price, a.expiresAt]);
        }
    }
    async removeAuction(id) {
        const db = await this.client.getDb();
        const result = await db.run('DELETE FROM auctions WHERE id = ?', [id]);
        return result.changes > 0;
    }
}

export class SqliteMessageRepository {
    constructor(client) { this.client = client; }
    async getAll() {
        const db = await this.client.getDb();
        const rows = await db.all('SELECT * FROM messages ORDER BY timestamp ASC');
        return rows.map(r => ({ ...r, edited: r.edited === 1, emojis: JSON.parse(r.emojis), reply: JSON.parse(r.reply) }));
    }
    async saveMessage(msg) {
        const db = await this.client.getDb();
        await db.run('INSERT INTO messages (id, user, message, timestamp, edited, prestige, emojis, reply) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [msg.id, msg.user, msg.message, msg.timestamp, msg.edited ? 1 : 0, msg.prestige || 0, JSON.stringify(msg.emojis || []), JSON.stringify(msg.reply || null)]);
    }
    async editMessage(id, username, newText) {
        const db = await this.client.getDb();
        await db.run('UPDATE messages SET message = ?, edited = 1 WHERE id = ? AND user = ?', [newText, id, username]);
    }
    async deleteMessage(id, username) {
        const db = await this.client.getDb();
        await db.run('DELETE FROM messages WHERE id = ? AND user = ?', [id, username]);
    }
    async addReaction(messageId, emojiName, username) {
        const db = await this.client.getDb();
        const row = await db.get('SELECT emojis FROM messages WHERE id = ?', [messageId]);
        if (!row) return;
        const emojis = JSON.parse(row.emojis || '[]');
        let entry = emojis.find(e => e.name === emojiName);
        if (!entry) { entry = { name: emojiName, users: [] }; emojis.push(entry); }
        if (!entry.users.includes(username)) { entry.users.push(username); }
        await db.run('UPDATE messages SET emojis = ? WHERE id = ?', [JSON.stringify(emojis), messageId]);
    }
}

export class SqliteBannedIpRepository {
    constructor(client) { this.client = client; }
    async isBanned(ip) {
        const db = await this.client.getDb();
        return await db.get('SELECT * FROM banned_ips WHERE ip = ?', [ip]);
    }
}