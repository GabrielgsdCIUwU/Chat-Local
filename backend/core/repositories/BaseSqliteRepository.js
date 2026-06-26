/**
 * @template T
 * @typedef {import('../../database/SqliteClient.js').SqliteClient} SqliteClient
 */

/**
 * Abstract Base Repository for SQLite.
 * Handles generic database operations and safe transactions
 * 
 * @template T - The Domain Entity type
 * @abstract
 */
export class BaseSqliteRepository {
    /**
     * @param {SqliteClient} client - The database client instance.
     * @param {string} tableName - The name of the table this repository manages.
     */
    constructor(client, tableName) {
        if (new.target === BaseSqliteRepository) {
            throw new TypeError("Cannot construct Abstract instances directly");
        }
        /** @protected */
        this.client = client;
        /** @protected */
        this.tableName = tableName;
    }

    /**
     * Retrieves all records from the table and maps them to domain entities.
     * @returns {Promise<T[]>}
     */
    async getAll() {
        const db = await this.client.getDb();
        const rows = await db.all(`SELECT * FROM ${this.tableName}`);
        return this.mapToDomain(rows);
    }

    /**
     * Executes a thread-safe exclusive transaction.
     * 
     * @param {function(T[]): Promise<void> | void} callback - The mutation logic.
     * @returns {Promise<void>}
     */
    async executeTransaction(callback) {
        const db = await this.client.getDb();
        await db.exec('BEGIN EXCLUSIVE TRANSACTION');
        try {
            const rows = await db.all(`SELECT * FROM ${this.tableName}`);
            const entities = this.mapToDomain(rows);
            
            await callback(entities);
            
            await this.saveAll(db, entities);
            
            await db.exec('COMMIT');
        } catch(e) { 
            await db.exec('ROLLBACK'); 
            throw e; 
        }
    }

    /**
     * Maps raw database rows to Domain Entities or structured objects.
     * @abstract
     * @protected
     * @param {any[]} rows - Raw database rows.
     * @returns {T[]}
     */
    mapToDomain(rows) {
        throw new Error("Method 'mapToDomain()' must be implemented.");
    }

    /**
     * Saves a collection of entities back to the database within the transaction.
     * @abstract
     * @protected
     * @param {import('sqlite').Database} db - The active database transaction connection.
     * @param {T[]} entities - Array of domain entities.
     * @returns {Promise<void>}
     */
    async saveAll(db, entities) {
        throw new Error("Method 'saveAll()' must be implemented.");
    }
}