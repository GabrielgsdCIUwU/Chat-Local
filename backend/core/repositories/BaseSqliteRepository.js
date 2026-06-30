/**
 * @template T
 * @typedef {import('../types.js').IDatabaseClient} IDatabaseClient
 */
/**
 * @template T
 * @typedef {import('../types.js').IBaseRepository<T>} IBaseRepository
 */

/**
 * Refactored Abstract Base Repository for SQLite.
 * Executes granular operations instead of full-table scanning.
 * 
 * @template T - The domain entity type.
 * @abstract
 * @implements {IBaseRepository<T>}
 */
export class BaseSqliteRepository {
    /**
     * @param {IDatabaseClient<T>} client - Database connection wrapper.
     * @param {string} tableName - Managed SQL database table.
     */
    constructor(client, tableName) {
        if (new.target === BaseSqliteRepository) {
            throw new TypeError("Cannot construct Abstract instances directly.");
        }
        /** @protected */
        this.client = client;
        /** @protected */
        this.tableName = tableName;
    }

    /**
     * Retrieves all records from the table.
     * @returns {Promise<T[]>}
     */
    async getAll() {
        const db = await this.client.getDb();
        const rows = await db.all(`SELECT * FROM ${this.tableName}`);
        return this.mapToDomain(rows);
    }

    /**
     * Finds a single entity by its unique primary identifier.
     * @abstract
     * @param {string} id - Row primary key.
     * @returns {Promise<T|null>} Target entity, or null.
     */
    async findById(id) {
        throw new Error("Method 'findById()' must be implemented.");
    }

    /**
     * Safely executes an isolated update on a single entity within an immediate transaction.
     * Avoids mass database updates and excessive system locks.
     * 
     * @param {string} id - The entity identifier.
     * @param {function(T): (Promise<void>|void)} callback - Pure modification business rule.
     * @returns {Promise<void>}
     */
    async updateTransactional(id, callback) {
        const db = await this.client.getDb();
        await db.exec('BEGIN IMMEDIATE TRANSACTION');
        try {
            let entity = await this.findById(id);
            if (!entity) {
                entity = this.createDefault(id);
            }

            await callback(entity);

            await this.saveSingle(db, entity);
            await db.exec('COMMIT');
        } catch (error) {
            await db.exec('ROLLBACK');
            throw error;
        }
    }

    /**
     * Factory method to create a default entity if not found in persistent store.
     * @abstract
     * @protected
     * @param {string} id - The aggregate identifier.
     * @returns {Awaited<T>}
     */
    createDefault(id) {
        throw new Error("Method 'createDefault()' must be implemented by subclasses.");
    }

    /**
     * Maps raw database rows to Domain Entities.
     * @abstract
     * @protected
     * @param {any[]} rows - Raw SQL database rows.
     * @returns {T[]}
     */
    mapToDomain(rows) {
        throw new Error("Method 'mapToDomain()' must be implemented.");
    }

    /**
     * Persists or replaces a single domain entity record.
     * @abstract
     * @protected
     * @param {import('../types.js').ISqlConnection} db - Active transaction reference.
     * @param {T} entity - Domain entity to save.
     * @returns {Promise<void>}
     */
    async saveSingle(db, entity) {
        throw new Error("Method 'saveSingle()' must be implemented.");
    }

    /**
     * Fallback batch save method required by interface structure.
     * @abstract
     * @protected
     * @param {import('../types.js').ISqlConnection} db - Active transaction reference.
     * @param {T[]} entities - Array of domain entities.
     * @returns {Promise<void>}
     */
    async saveAll(db, entities) {
        throw new Error("Method 'saveAll()' must be implemented.");
    }
}