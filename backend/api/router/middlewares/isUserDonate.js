import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JsonDatabaseClient } from '../../../database/JsonDatabaseClient.js';
import { ROLES } from '../../../core/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersDb = new JsonDatabaseClient(path.join(__dirname, "../../../data/users.json"));

/**
 * Checks if the user in the current session has Donor or Admin privileges.
 * 
 * @param {import('express').Request} req 
 * @returns {Promise<boolean>}
 */
export async function isUserDonate(req, callback) {
     try {
        const users = await usersDb.read();
        const user = users.find(u => u.name === req.session.user.name);
        
        if (!user) return false;
        
        return user.roles.includes(ROLES.DONADOR) || user.roles.includes(ROLES.ADMIN);
    } catch (error) {
        console.error("Error al verificar privilegios:", error);
        return false;
    }
}

export default { isUserDonate };