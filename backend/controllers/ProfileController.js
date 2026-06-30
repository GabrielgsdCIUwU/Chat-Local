import { ApiResponse } from "../core/ApiResponse.js";

export class ProfileController {
    /**
     * @param {import('../core/types.js').IUserService} userService 
     */
    constructor(userService) {
        this.userService = userService;
    }

    getProfileData = async (req, res) => {
        try {
            if (!req.session?.user?.name) {
                return ApiResponse.error(res, "Sesión inválida", 401);
            }

            const data = await this.userService.getUserData(req.session.user.name);
            return res.json(data);
        } catch (error) {
            return ApiResponse.error(res, error.message, 500);
        }
    };

    updateColor = async (req, res) => {
        const { color } = req.body;
        try {
            await this.userService.changeColor(req.session.user.name, color);
            return ApiResponse.success(res, "Color actualizado correctamente", { color });
        } catch (error) {
            return ApiResponse.error(res, error.message, error.message.includes("permisos") ? 403 : 500);
        }
    };

    updateProfileImage = async (req, res) => {
        if (!req.file) {
            return ApiResponse.error(res, "No se ha subido ninguna imágen válida", 400);
        }

        try {
            if (!req.session?.user?.name) {
                return ApiResponse.error(res, "Sesión inválida", 401);
            }

            const extension = req.file.originalname.includes(".")
                ? req.file.originalname.slice(req.file.originalname.lastIndexOf("."))
                : ".jpg";

            await this.userService.changeProfileImage(req.session.user.name, extension);
            return ApiResponse.success(res, "Imagen de perfil subida correctamente", { filename: req.file.filename });
        } catch (error) {
            return ApiResponse.error(res, error.message, 403);
        }
    };

    updateUsername = async (req, res) => {
        const { nombre: newName } = req.body;
        try {
            await this.userService.changename(req.session.user.name, newName);
            req.session.user.name = newName;
            return ApiResponse.success(res, "Nombre actualizado correctamente", { nombre: newName });
        } catch (error) {
            let status = 500;
            if (error.message.includes("utilizado")) {
                status = 409;
            } else if (error.message.includes("permisos")) {
                status = 403;
            }
            return ApiResponse.error(res, error.message, status);
        }
    }
}