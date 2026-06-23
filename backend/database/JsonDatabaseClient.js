import fs from "node:fs/promises";

export class JsonDatabaseClient {
    queue = Promise.resolve();
    
    /**
     * 
     * @param {string} filePath - Absolute path to the JSON file. 
     */
    constructor(filePath) {
        this.filePath = filePath;
    }

    /**
     * Reads and parses the JSON file.
     * @returns {Promise<Array<any>>} The parsed JSON data (defaults to an empty array if file not found).
     * @throws {Error} If there is a parsing error or a file system error other than ENOENT.
     */
    async read() {
        try {
            const data = await fs.readFile(this.filePath, "utf-8");
            return JSON.parse(data);
        } catch (error) {
            if (error.code === "ENOENT") return [];
            throw error;
        }
    }

    /**
     * Stringifies and writes data to the JSON file.
     * @param {any} data - The data to be written.
     * @returns {Promise<void>}
     */
    async write(data) {
        await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    }

    /**
     * Executes a blocking transaction safely.
     * @param {Function} callback - A function that receives current data and returns modified data.
     * @returns {Promise<any>} The modifed data after successful write. 
     */
    async update(callback) {
        return new Promise((resolve, reject) => {
            const currentTask = this.queue.then(async () => {
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
            this.queue = currentTask.catch(() => {});
        });
    }
}