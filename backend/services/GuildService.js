import crypto from "node:crypto";

export class GuildService {
    /**
     * 
     * @param {import('./EconomyService.js').EconomyService} economyService 
     * @param {import('../repositories/GuildRepository.js').GuildRepository} guildRepository 
     */
    constructor(economyService, guildRepository) {
        this.economyService = economyService;
        this.guildRepository = guildRepository;
        this.GUILD_CREATION_COST = 50000;
    }

    /**
     * Founds a new guild if the user has enough money and isn't in one already.
     * @param {string} founderName - The user creating the guild.
     * @param {string} guildName - The requested name for the guild.
     * @returns {Promise<import('../repositories/GuildRepository.js').Guild>} The created guild.
     * @throws {Error} If user lacks funds or is already in a guild.
     */
    async createGuild(founderName, guildName) {
        if (guildName.length < 3 || guildName.length > 20) {
            throw new Error("El nombre de la guild debe ser entre 3 y 20 caracteres.");
        }

        const guilds = await this.guildRepository.getAll();

        if (guilds.some(g => g.name.toLowerCase() === guildName.toLowerCase())) {
            throw new Error("Ya existe una guild con este nombre.");
        }

        const userInGuild = guilds.some(g => g.members.some(m => m.name === founderName));
        if (userInGuild) {
            throw new Error("Ya eres miembro de una guild.");
        }

        await this.economyService.removeFunds(founderName, this.GUILD_CREATION_COST);

        const newGuild = {
            id: crypto.randomBytes(4).toString("hex"),
            name: guildName,
            level: 1,
            bankMoney: 0,
            members: [{name: founderName, rank: "Leader"}],
        };

        await this.guildRepository.executeTransaction((currentGuilds) => {
            currentGuilds.push(newGuild);
        });

        return newGuild;
    }


    /**
     * Retrieves the guild information for a specific user.
     * @param {string} username 
     * @returns {Promise<import('../repositories/GuildRepository.js').Guild | undefined>}
     */
    async getUserGuild(username) {
        const guilds = await this.guildRepository.getAll();
        return guilds.find(g => g.members.some(m => m.name === username));
    }
}