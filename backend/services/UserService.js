import fs from "node:fs";
import path from "node:path";
import { ROLES } from "../core/constants.js";

export class UserService {
    /**
     * 
     * @param {import('../core/types.js').IUserRepository} userRepository 
     * @param {string} profileDir - Path to the directory where profile images are stored
     */
    constructor(userRepository, profileDir) {
        this.userRepo = userRepository;
        this.profileDir = profileDir;
    }

    /**
     * 
     * @param {import("../core/types.js").User} user 
     * @returns 
     */
    #hasPrivilege(user) {
        return user.roles.includes(ROLES.DONADOR) || user.roles.includes(ROLES.ADMIN);
    }

    /**
     * 
     * @param {string} username 
     */
    async getUserData(username) {
        const user = await this.userRepo.findByName(username);
        if (!user) throw new Error("Usuario no encontrado");
        return {
            nombre: user.name,
            color: user.color || "#FFFFFF",
            img: user.img || null
        };
    }

    /**
     * 
     * @param {string} username 
     * @param {string} newColor 
     * @returns 
     */
    async changeColor(username, newColor) {
        const user = await this.userRepo.findByName(username);
        if (!user) throw new Error("Usuario no encontrado");
        if (!this.#hasPrivilege(user)) throw new Error("No tienes permisos para cambiar el color");

        user.color = newColor;
        await this.userRepo.save(user);
        
        return true;
    }

    /**
     * 
     * @param {string} username 
     * @param {string} extension 
     * @returns 
     */
    async changeProfileImage(username, extension) {
        const user = await this.userRepo.findByName(username);
        if (!user) throw new Error("Usuario no encontrado");
        if (!this.#hasPrivilege(user)) throw new Error("No tienes permisos para cambiar la imágen");

        user.img = extension;
        await this.userRepo.save(user);

        return true;
    }

    /**
     * 
     * @param {string} oldName 
     * @param {string} newName 
     */
    async changename(oldName, newName) {
         const user = await this.userRepo.findByName(oldName);
        if (!user) throw new Error("Usuario no encontrado");
        if (!this.#hasPrivilege(user)) throw new Error("No tienes permisos para cambiar el nombre");

        const nameTaken = await this.userRepo.findByName(newName);
        if (nameTaken) throw new Error("Nombre de usuario ya utilizado");

        const updatedUser = { ...user, name: newName };
        
        await this.userRepo.save(updatedUser);

        await this.userRepo.deleteByName(oldName);

        try {
            const files = fs.readdirSync(this.profileDir);
            const profileFile = files.find(file => file.startsWith(`${oldName}_profile.`));
            if (profileFile) {
                const ext = path.extname(profileFile);
                fs.renameSync(
                    path.join(this.profileDir, profileFile),
                    path.join(this.profileDir, `${newName}_profile${ext}`)
                );
            }
        } catch (error) {
            console.error("Error renaming profile image:", error);
        }
    }

    /**
     * Updates a user's system security roles. Includes self-lockout prevention safety logic.
     * 
     * @param {string} adminUsername - The executing administrator username.
     * @param {string} targetUsername - The user whose roles will be updated.
     * @param {string[]} newRoles - Array of valid role strings to assign.
     * @returns {Promise<void>}
     */
    async updateUserRoles(adminUsername, targetUsername, newRoles) {
        const admin = await this.userRepo.findByName(adminUsername);
        if (!admin?.roles.includes(ROLES.ADMIN)) {
            throw new Error("No posees privilegios de administrador para realizar esta acción.");
        }

        const targetUser = await this.userRepo.findByName(targetUsername);
        if (!targetUser) {
            throw new Error("El usuario objetivo no existe.");
        }

        /** @type {string[]} */
        const allowedRoles = Object.values(ROLES);
        const isValid = newRoles.every(role => allowedRoles.includes(role));
        if (!isValid) {
            throw new Error(`Roles inválidos. Roles permitidos: ${allowedRoles.join(", ")}`);
        }

        if (targetUsername === adminUsername && !newRoles.includes(ROLES.ADMIN)) {
            const allUsers = await this.userRepo.findAll();
            const totalAdmins = allUsers.filter(u => u.roles.includes(ROLES.ADMIN)).length;
            if (totalAdmins <= 1) {
                throw new Error("Operación cancelada: No puedes retirar tu propio rol de Administrador porque eres el único administrador en el sistema.");
            }
        }

        targetUser.roles = newRoles;
        await this.userRepo.save(targetUser);
    }
}