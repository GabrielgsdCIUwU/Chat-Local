import { getUserNames } from "../../socket/state.js";
import { ApiResponse } from "../core/ApiResponse.js";
import { ROLES } from "../core/constants.js";

export class ChatController {
    /**
     * @param {import('../services/CommandService.js').CommandService} commandService 
     */
    constructor(commandService) {
        this.commandService = commandService;
    }

    getCommands = async (req, res) => {
        try {
            const tree = await this.commandService.getCommandTree();

            const isAdmin = req.session.user?.roles?.includes(ROLES.ADMIN);
            const filterTree = (node) => {
                const result = {};
                for (const [key, value] of Object.entries(node)) {
                    if (key === "params" || key === "description" || key === "adminOnly") {
                        result[key] = value;
                        continue;
                    }
                    if (value.adminOnly && !isAdmin) continue;
                    
                    result[key] = filterTree(value);
                }
                return result;
            };
            const filteredTree = filterTree(tree);

            return res.json(filteredTree);
        } catch (error) {
            console.error("Error generating commands tree:", error);
            ApiResponse.error(res, "Error al cargar comandos", 500);
        }
    };

    getUsers = async (req, res) => {
        try {
            const users = await getUserNames();
            return res.json(users);
        } catch (error) {
            console.error("Error al leer los usuarios", error);
            ApiResponse.error(res, "Error al obtener usuarios", 500);
        }
    };
}