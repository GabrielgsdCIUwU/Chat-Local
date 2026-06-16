import bcrypt from "bcrypt";

/**
 * @typedef {Object} UserDTO
 * @property {string} name - Username.
 * @property {string[]} roles - User assigned roles.
 * @property {string} [color] - User custom color if available.
 */

export class AuthService {
    /**
     * @param {import('../repositories/UserRepository.js').UserRepository} userRepository 
     * @param {import('../repositories/BannedIpRepository.js').BannedIpRepository} bannedIpRepository 
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