import fs from "node:fs";
import path from "node:path";
import { ROLES } from "../core/constants.js";

export class UserService {
    /**
     * 
     * @param {import('../repositories/UserRepository.js').UserRepository} userRepository 
     * @param {string} profileDir - Path to the directory where profile images are stored
     */
    constructor(userRepository, profileDir) {
        this.userRepo = userRepository;
        this.profileDir = profileDir;
    }

    #hasPrivilege(user) {
        return user.roles.includes(ROLES.DONADOR) || user.roles.includes(ROLES.ADMIN);
    }

    async getUserData(username) {
        const user = await this.userRepo.findByName(username);
        if (!user) throw new Error("Usuario no encontrado");
        return {
            nombre: user.name,
            color: user.color || "#FFFFFF",
            img: user.img || null
        };
    }

    async changeColor(username, newColor) {
        let updated = false;
        await this.userRepo.db.update((users) => {
            const user = users.find(u => u.name === username);
            if (!user) throw new Error("Usuario no enctrado");
            if (!this.#hasPrivilege(user)) throw new Error("No tienes permisos para cambiar el color");

            user.color = newColor;
            updated = true;
            return users;
        });
        return updated;
    }

    async changeProfileImage(username, extension) {
        let updated = false;
        await this.userRepo.db.update((users) => {
            const user = users.find(u => u.name === username);
            if (!user) throw new Error("Usuario no encontrado");
            if (!this.#hasPrivilege(user)) throw new Error("No tienes permisos para cambiar la imágen");

            user.img = extension;
            updated = true;
            return users;
        });
        return updated;
    }

    async changename(oldName, newName) {
        await this.userRepo.db.update((users) => {
            const user = users.find(u => u.name === oldName);
            if (!user) throw new Error("Usuario no encontrado");
            if (!this.#hasPrivilege(user)) throw new Error("No tienes permisos para cambiar el nombre");

            const nameTaken = users.some(u => u.name === newName);
            if(nameTaken) throw new Error("Nombre de usuario ya utilizado");

            user.name = newName;
            return users;
        });

        try {
            const files = fs.readdirSync(this.profileDir);
            const profileFile = files.find(file => file.startsWith(`${oldName}_profile.`));
            if(profileFile) {
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
}