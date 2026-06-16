import { getUserNames } from "../../socket/state.js";
import { ApiResponse } from "../core/ApiResponse.js";

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
            return res.json(tree);
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