export class ApiResponse {
    static success(res, message, data = {}, statusCode = 200) {
        return res.status(statusCode).json({message, data});
    }

    static error(res, message, statusCode = 400) {
        return res.status(statusCode).json({ message });
    }
}