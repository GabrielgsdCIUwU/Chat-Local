export function isAdmin(req, res) {
    if (req.ip == "::1" || req.ip == "::ffff:127.0.0.1") {
        return true;
    }
}

export default { isAdmin };