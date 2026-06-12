/**
 * @typedef {Object} User
 * @property {string} name - Username.
 * @property {string} passwd - Hashed or plain text password.
 * @property {string|string[]} location - IP address(es) associated with the user.
 * @property {string[]} roles - Array of user roles (e.g., 'Admin', 'Donador').
 * @property {string} [color] - Optional custom name color.
 * @property {string} [img] - Optional profile image extension.
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
        await this.db.update((users) => {
            const index = users.findIndex(u => u.name === user.name);
            if (index !== -1) {
                users[index] = user;
            } else {
                users.push(user);
            }

            return users;
        });
    }
}