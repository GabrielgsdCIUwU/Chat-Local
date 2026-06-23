import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SqliteClient } from './backend/database/SqliteClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function readJson(filename) {
    try {
        const data = await fs.readFile(path.join(__dirname, `backend/data/${filename}`), 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

async function runMigration() {
    console.log("🚀 Iniciando migración de JSON a SQLite...");
    const client = new SqliteClient();
    const db = await client.getDb();

    try {
        await db.exec('BEGIN TRANSACTION');

        // 1. Migrar Users y guardar los nombres válidos
        const users = await readJson('users.json');
        const validUsers = new Set();
        
        for (const u of users) {
            await db.run(
                `INSERT OR IGNORE INTO users (name, passwd, location, roles, color, img) VALUES (?, ?, ?, ?, ?, ?)`,
                [u.name, u.passwd, u.location, JSON.stringify(u.roles || []), u.color, u.img]
            );
            validUsers.add(u.name);
        }
        console.log(`✅ ${users.length} Usuarios migrados.`);

        // 2. Migrar Economy
        const economy = await readJson('economy.json');
        for (const e of economy) {
            if (!validUsers.has(e.name)) {
                console.log(`⚠️ Ignorando cartera huérfana de: ${e.name}`);
                continue;
            }
            await db.run(
                `INSERT OR IGNORE INTO economy (name, money, debt) VALUES (?, ?, ?)`,
                [e.name, e.money, e.debt]
            );
        }
        console.log(`✅ Carteras migradas.`);

        // 3. Migrar Gambling
        const gambling = await readJson('gambling.json');
        for (const g of gambling) {
            if (!validUsers.has(g.name)) continue;
            await db.run(
                `INSERT OR IGNORE INTO gambling (name, totalEarnings, spend, timesSteal, moneySteal, duelWin, duelLose, bankRupt, lastRobbery, lastDaily, dailyStreak) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [g.name, g.totalEarnings, g.spend, g.timesSteal, g.moneySteal, g.duelWin, g.duelLose, g.bankRupt, g.lastRobbery, g.lastDaily, g.dailyStreak]
            );
        }
        console.log(`✅ Perfiles de Apuestas migrados.`);

        // 4. Migrar Inventory
        const inventory = await readJson('inventory.json');
        for (const i of inventory) {
            if (!validUsers.has(i.name)) continue;
            await db.run(
                `INSERT OR IGNORE INTO inventory (name, items) VALUES (?, ?)`,
                [i.name, JSON.stringify(i.items || {})]
            );
        }
        console.log(`✅ Inventarios migrados.`);

        // 5. Migrar Jobs (RPG)
        const jobs = await readJson('jobs.json');
        for (const j of jobs) {
            if (!validUsers.has(j.name)) continue;
            await db.run(
                `INSERT OR IGNORE INTO jobs (name, job, toolLevel, lastWork, activeBuffs, prestigeLevel, activeExpedition) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [j.name, j.job, j.toolLevel, j.lastWork, JSON.stringify(j.activeBuffs || {}), j.prestigeLevel || 0, JSON.stringify(j.activeExpedition || null)]
            );
        }
        console.log(`✅ Trabajos (RPG) migrados.`);

        // 6. Migrar Pets
        const pets = await readJson('pets.json');
        for (const p of pets) {
            if (!validUsers.has(p.name)) continue;
            await db.run(
                `INSERT OR IGNORE INTO pets (name, eggs, pets, equipped) VALUES (?, ?, ?, ?)`,
                [p.name, p.eggs, JSON.stringify(p.pets || []), p.equipped]
            );
        }
        console.log(`✅ Perfiles de Mascotas migrados.`);

        // 7. Migrar Guilds (No dependen de usuario directamente en la base de datos)
        const guilds = await readJson('guilds.json');
        for (const g of guilds) {
            await db.run(
                `INSERT OR IGNORE INTO guilds (id, name, level, bankMoney, members) VALUES (?, ?, ?, ?, ?)`,
                [g.id, g.name, g.level, g.bankMoney, JSON.stringify(g.members || [])]
            );
        }
        console.log(`✅ Gremios migrados.`);

        // 8. Migrar Auctions
        const auctions = await readJson('auctions.json');
        for (const a of auctions) {
            await db.run(
                `INSERT OR IGNORE INTO auctions (id, seller, itemName, amount, price, expiresAt) VALUES (?, ?, ?, ?, ?, ?)`,
                [a.id, a.seller, a.itemName, a.amount, a.price, a.expiresAt]
            );
        }
        console.log(`✅ Subastas migradas.`);

        // 9. Migrar Messages
        const messages = await readJson('messages.json');
        for (const m of messages) {
            await db.run(
                `INSERT OR IGNORE INTO messages (id, user, message, timestamp, edited, prestige, emojis, reply) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [m.id, m.user, m.message, m.timestamp, m.edited ? 1 : 0, m.prestige || 0, JSON.stringify(m.emojis || []), JSON.stringify(m.reply || null)]
            );
        }
        console.log(`✅ ${messages.length} Mensajes migrados.`);

        // 10. Banned IPs
        const banned = await readJson('usersban.json');
        for (const b of banned) {
            await db.run(`INSERT OR IGNORE INTO banned_ips (ip, motivo) VALUES (?, ?)`, [b.ip, b.motivo]);
        }
        console.log(`✅ IPs baneadas migradas.`);

        await db.exec('COMMIT');
        console.log("🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO! Limpieza de huérfanos realizada.");

    } catch (error) {
        await db.exec('ROLLBACK');
        console.error("❌ Error durante la migración, los cambios se han deshecho:", error);
    }
}

runMigration();
