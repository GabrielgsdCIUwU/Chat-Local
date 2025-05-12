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
                const user = usersData.find(user => user.name === req.session.user.name && (user.role === "Donador" || user.role === "Admin"));
                resolve(!!user);
            } catch (error) {
                console.error("Error al parsear los usuarios:", error);
                resolve(false);
            }
        });
    });
}

export default { isUserDonate };