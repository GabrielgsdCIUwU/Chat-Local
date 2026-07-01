import { ApiResponse } from "../core/ApiResponse.js";

export class AuthController {
    /**
     * @param {import('../core/types.js').IAuthService} authService - Service for authentication logic.
     * @param {import('../core/types.js').IUserRepository} userRepository - Repository for user data.
     * @param {import('../core/types.js').IUserService} userService - Service for user profiles and roles logic.
     */
    constructor(authService, userRepository, userService) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    /**
     * Handles the login request.
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     */
    login = async (req, res) => {
        try {
            const { name, passwd } = req.body;

            if (!name || !passwd) {
                return ApiResponse.error(res, "Debes poner usuario y contraseña!", 400);
            }

            const location = req.ip;
            if (!location) {
                return ApiResponse.error(res, "Se ha producido un error al obtener tu IP local", 400);
            }

            const userDTO = await this.authService.login(name, passwd, location);

            req.session.user = {
                name: userDTO.name,
                roles: userDTO.roles
            };
            return ApiResponse.success(res, "Login exitoso!", userDTO);
        } catch (error) {
            const statusCode = error.message.includes('baneado') ? 403 : 401;
            return ApiResponse.error(res, error.message, statusCode);
        }
    };

    /**
     * Handles the user registration request.
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     */
    register = async (req, res) => {
        try {
            const { name, passwd } = req.body;
            if (!name || !passwd) {
                return ApiResponse.error(res, "Debes poner usuario y contraseña!", 400);
            }

            const location = req.ip;
            if (!location) {
                return ApiResponse.error(res, "Se ha producido un error al obtener tu IP local", 400);
            }
            await this.authService.register(name, passwd, location);

            return ApiResponse.success(res, "Usuario creado exitosamente");
        } catch (error) {
            return ApiResponse.error(res, error.message, 400);
        }
    };

    /**
     * Retrieves a list of all registered usernames.
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     */
    listUsers = async (req, res) => {
        try {
            const users = await this.userRepository.findAll();
            const names = users.map(user => user.name);
            return res.json(names);
        } catch (error) {
            console.error(error);
            return ApiResponse.error(res, "Se ha producido un error en el servidor.", 500);
        }
    };

    /**
     * Administrative handler to assign roles.
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     */
    assignRoles = async (req, res) => {
        try {
            const adminName = req.session.user.name;
            const { targetUser, roles } = req.body;

            if (!targetUser || !Array.isArray(roles)) {
                return ApiResponse.error(res, "La solicitud debe contener un targetUser y un array de roles.", 400);
            }

            await this.userService.updateUserRoles(adminName, targetUser, roles);
            return ApiResponse.success(res, `Roles actualizados con éxito para ${targetUser}.`);
        } catch (error) {
            return ApiResponse.error(res, error.message, 400);
        }
    };
}