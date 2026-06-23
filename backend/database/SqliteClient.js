import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../data/database.sqlite');

export class SqliteClient {
    constructor() {
        this.dbPromise = this.#initDb();
    }

    async #initDb() {
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        await db.exec('PRAGMA foreign_keys = ON;');
        await db.exec('PRAGMA journal_mode = WAL;');

        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                name TEXT PRIMARY KEY,
                passwd TEXT,
                location TEXT,
                roles TEXT, -- Se guardará como JSON stringify
                color TEXT,
                img TEXT
            );

            CREATE TABLE IF NOT EXISTS banned_ips (
                ip TEXT PRIMARY KEY,
                motivo TEXT
            );

            CREATE TABLE IF NOT EXISTS economy (
                name TEXT PRIMARY KEY,
                money INTEGER DEFAULT 100,
                debt INTEGER DEFAULT 0,
                FOREIGN KEY (name) REFERENCES users(name) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS gambling (
                name TEXT PRIMARY KEY,
                totalEarnings INTEGER DEFAULT 0,
                spend INTEGER DEFAULT 0,
                timesSteal INTEGER DEFAULT 0,
                moneySteal INTEGER DEFAULT 0,
                duelWin INTEGER DEFAULT 0,
                duelLose INTEGER DEFAULT 0,
                bankRupt INTEGER DEFAULT 0,
                lastRobbery INTEGER DEFAULT 0,
                lastDaily INTEGER DEFAULT 0,
                dailyStreak INTEGER DEFAULT 0,
                FOREIGN KEY (name) REFERENCES users(name) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS inventory (
                name TEXT PRIMARY KEY,
                items TEXT, -- JSON map
                FOREIGN KEY (name) REFERENCES users(name) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS jobs (
                name TEXT PRIMARY KEY,
                job TEXT,
                toolLevel INTEGER DEFAULT 1,
                lastWork INTEGER DEFAULT 0,
                activeBuffs TEXT, -- JSON map
                prestigeLevel INTEGER DEFAULT 0,
                activeExpedition TEXT, -- JSON
                FOREIGN KEY (name) REFERENCES users(name) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS pets (
                name TEXT PRIMARY KEY,
                eggs INTEGER DEFAULT 0,
                pets TEXT, -- JSON array
                equipped TEXT,
                FOREIGN KEY (name) REFERENCES users(name) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS guilds (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE,
                level INTEGER DEFAULT 1,
                bankMoney INTEGER DEFAULT 0,
                members TEXT -- JSON array
            );

            CREATE TABLE IF NOT EXISTS auctions (
                id TEXT PRIMARY KEY,
                seller TEXT,
                itemName TEXT,
                amount INTEGER,
                price INTEGER,
                expiresAt INTEGER
            );

            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                user TEXT,
                message TEXT,
                timestamp INTEGER,
                edited BOOLEAN DEFAULT 0,
                prestige INTEGER DEFAULT 0,
                emojis TEXT, -- JSON array
                reply TEXT -- JSON
            );
        `);

        return db;
    }

    /**
     * @returns {Promise<import('sqlite').Database>}
     */
    async getDb() {
        return await this.dbPromise;
    }
}