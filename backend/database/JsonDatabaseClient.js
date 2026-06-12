import fs from "node:fs/promises";

export class JsonDatabaseClient {
    queue = Promise.resolve();

    constructor(filePath) {
        this.filePath = filePath;
    }

    async read() {
        try {
            const data = await fs.readFile(this.filePath, "utf-8");
            return JSON.parse(data);
        } catch (error) {
            if (error.code === "ENOENT") return [];
            throw error;
        }
    }

    async write(data) {
        await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    }

    /**
     * 
     * @param {Function} callback 
     */
    async update(callback) {
        return new Promise((resolve, reject) => {
            this.queue = this.queue.then(async () => {
                try {
                    const data = await this.read();
                    const modifiedData = await callback(data);
                    if (modifiedData !== undefined) {
                        await this.write(modifiedData);
                    }
                    resolve(modifiedData);
                } catch (error) {
                    reject(error);
                }
            });
        })
    }
}