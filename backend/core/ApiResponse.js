export class ApiResponse {
    /**
     * Sends a successful JSON response.
     * @param {import('express').Response} res - The Express response object.
     * @param {string} message - Success message to send to the client. 
     * @param {Object} data - Optional data payload (DTO). 
     * @param {number} statusCode - HTTP status code. 
     * @returns {import('express').Response}
     */
    static success(res, message, data = {}, statusCode = 200) {
        return res.status(statusCode).json({message, data});
    }

    /**
     * Sends an error JSON response.
     * @param {import('express').Response} res - The Express response object.
     * @param {string} message - Error message describing what went wrong. 
     * @param {number} statusCode - HTTP status code. 
     * @returns {import('express').Response}
     */
    static error(res, message, statusCode = 400) {
        return res.status(statusCode).json({ message });
    }
}