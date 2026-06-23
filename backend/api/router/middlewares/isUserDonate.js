import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROLES } from '../../../core/constants.js';
import { container } from '../../../core/DIContainer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Checks if the user in the current session has Donor or Admin privileges.
 * 
 * @param {import('express').Request} req 
 * @returns {Promise<boolean>}
 */
export async function isUserDonate(req) {
     try {
        const user = await container.userRepository.findByName(req.session.user.name);
        
        if (!user) return false;
        
        return user.roles.includes(ROLES.DONADOR) || user.roles.includes(ROLES.ADMIN);
    } catch (error) {
        console.error("Error al verificar privilegios:", error);
        return false;
    }
}

export default { isUserDonate };