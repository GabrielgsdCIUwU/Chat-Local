/** @typedef {import('../core/types.js').IUserRepository} IUserRepository */
/** @typedef {import('../core/types.js').User} User */

/**
 * Repository handling serialization and search of persistent user data.
 * 
 * @implements {IUserRepository}
 */
export class UserRepository {
    /**
     * @param {import('../database/JsonDatabaseClient.js').JsonDatabaseClient} dbClient 
     */
    constructor(dbClient) {
        this.db = dbClient;
    }

    /**
     * Retrieves all users from the database.
     * @returns {Promise<User[]>} Array of user objets.
     */
    async findAll() {
        return await this.db.read();
    }

    /**
     * Finds a specific user by their username.
     * @param {string} name - The username to search for.
     * @returns {Promise<User | undefined>} The user object if found, otherwhise undefined.
     */
    async findByName(name) {
        const users = await this.findAll();
        return users.find(u => u.name === name);
    }

    /**
     * Saves a new user or updates an existing one.
     * @param {User} user - The user object to save 
     */
    async save(user) {
        await this.db.update((/**@type {User[]}*/users) => {
            const index = users.findIndex(u => u.name === user.name);
            if (index !== -1) {
                users[index] = user;
            } else {
                users.push(user);
            }

            return users;
        });
    }

    /**
     * Deletes a user profile by name.
     * @param {string} name - Username to delete.
     * @returns {Promise<void>}
     */
    async deleteByName(name) {
        await this.db.update((users) => {
            const index = users.findIndex(u => u.name === name);
            if (index !== -1) {
                users.splice(index, 1);
            }
            return users;
        });
    }
}