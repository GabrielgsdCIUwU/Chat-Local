import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersFilePath = path.join(__dirname, "../../backend/json/users.json");

export function isUserDonate(req, callback) {
    return new Promise((resolve, reject) => {
        fs.readFile(usersFilePath, "utf8", (err, data) => {
            if (err) {
                console.error("Error al leer los usuarios:", err);
                return resolve(false);
            }

            let usersData = [];
            try {
                usersData = JSON.parse(data);
                const user = usersData.find(user => {
                    if (user.name !== req.session.user.name) return false;

                    if (user.roles.includes("Donador") ||user.roles.includes("Admin")) return true;
                    return false;
                });
                resolve(!!user);
            } catch (error) {
                console.error("Error al parsear los usuarios:", error);
                resolve(false);
            }
        });
    });
}

export default { isUserDonate };