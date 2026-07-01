import { ROLES } from "../../../core/constants.js";
/**
 * Express middleware to verify if the authenticated session user possesses Administrator privileges.
 * 
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware callback.
 * @returns {void|import('express').Response}
 */
export function isAdmin(req, res, next) {
    if (req.session?.user?.roles.includes(ROLES.ADMIN)) {
        return next();
    }
    return res.status(403).json({ message: "Forbidden: No tienes privilegios de administrador." });
}

export default { isAdmin };