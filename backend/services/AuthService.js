import bcrypt from "bcrypt";
import { VALIDATION_CONFIG } from "../core/constants.js";

/**
 * @typedef {import('../core/types.js').UserDTO} UserDTO
 */

export class AuthService {
    /**
     * @param {import('../core/types.js').IUserRepository} userRepository 
     * @param {import('../core/types.js').IBannedIpRepository} bannedIpRepository 
     */
    constructor(userRepository, bannedIpRepository) {
        this.userRepository = userRepository;
        this.bannedIpRepository = bannedIpRepository;
    }

    /**
     * Authenticates a user and performs security checks (Bans, IP mapping, Hashing).
     *
     * @param {string} name - The username. 
     * @param {string} password - The unhashed password provided by the client.
     * @param {string} ip - The current request IP address.
     * @returns {Promise<UserDTO>} A safe DTO without sensitive information.
     * @throws {Error} If authentication fails or IP is banned/unauthorized.
     */
    async login(name, password, ip) {
        if (!name || name.length > VALIDATION_CONFIG.USER.MAX_NAME) {
            throw new Error('Usuario o contraseña incorrecta!');
        }
        if (!password || password.length > VALIDATION_CONFIG.USER.MAX_PASS) {
            throw new Error('Usuario o contraseña incorrecta!');
        }

        const blockedIP = await this.bannedIpRepository.isBanned(ip);
        if (blockedIP) throw new Error(`Lo siento pero has sido baneado por: ${blockedIP.motivo}`);

        const user = await this.userRepository.findByName(name);
        if(!user) throw new Error('Usuario o contraseña incorrecta!');

        let isMatch = false;
        if (user.passwd.startsWith('$2b$') || user.passwd.startsWith('$2a$')) {
            isMatch = await bcrypt.compare(password, user.passwd);
        } else {
            isMatch = (password === user.passwd);
            if (isMatch) {
                user.passwd = await bcrypt.hash(password, 10);
            }
        }

        if (!isMatch) throw new Error('Usuario o contraseña incorrecta!');

        if (user.location !== ip) {
            user.location = ip;
        }

        await this.userRepository.save(user);

        return {name: user.name, roles: user.roles, color: user.color};
    }

    /**
     * 
     * @param {string} name 
     * @param {string} password 
     * @param {string} ip 
     */
    async register(name, password, ip) {
        const { MIN_NAME, MAX_NAME, MIN_PASS, MAX_PASS } = VALIDATION_CONFIG.USER;
        if (!name || name.length < MIN_NAME || name.length > MAX_NAME) {
            throw new Error(`El nombre debe tener entre ${MIN_NAME} y ${MAX_NAME} caracteres.`);
        }
        const nameRegex = /^[a-zA-Z0-9_]+$/;
        if (!nameRegex.test(name)) {
            throw new Error('El nombre solo puede contener letras, números y guiones bajos.');
        }

        if (!password || password.length < MIN_PASS || password.length > MAX_PASS) {
            throw new Error(`La contraseña debe tener entre ${MIN_PASS} y ${MAX_PASS} caracteres.`);
        }
        
        const userExists = await this.userRepository.findByName(name);
        if (userExists) throw new Error('El usuario ya existe');

        const hashedPassword = await bcrypt.hash(password, 10);

        await this.userRepository.save({
            name,
            passwd: hashedPassword,
            location: ip,
            roles: []
        });
    }
}