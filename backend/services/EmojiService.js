import fs from "node:fs";
import path from "node:path";
import sizeOf from "image-size";

export class EmojiService {
    /**
     * 
     * @param {string} emojisDir - Directory path where emojis are stored. 
     */
    constructor(emojisDir) {
        this.emojisDir = emojisDir;
    }

    /**
     * Retrieves a list of available emojis with their dimensions.
     * @returns {Array<{name: string, width: number, height: number, url: string}>}
     */
    getEmojiMetada() {
        const images = [];
        const files = fs.readdirSync(this.emojisDir);

        files.forEach((file) => {
            const fullPath = path.join(this.emojisDir, file);

            try {
                const fileBuffer = fs.readFileSync(fullPath);
                const dimensions = sizeOf(fileBuffer);

                if (!dimensions || typeof dimensions.width !== "number" || typeof dimensions.height !== "number") {
                    return;
                }

                images.push({
                    name: path.parse(file).name,
                    width: dimensions.width,
                    height: dimensions.height,
                    url: `/resources/emojis/${file}`
                });
            } catch (error) {
                console.warn(`No se pudo leer el emoji ${file}:`, error.message);
            }
        });

        return images;
    }
}