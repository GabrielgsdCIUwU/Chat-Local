import crypto from "node:crypto";
import { GAME_CONFIG } from "../core/constants.js";

export class GuildService {
    pendingInvites = new Map();

    /**
     * 
     * @param {import('./EconomyService.js').EconomyService} economyService 
     * @param {import('../repositories/GuildRepository.js').GuildRepository} guildRepository 
     */
    constructor(economyService, guildRepository) {
        this.economyService = economyService;
        this.guildRepository = guildRepository;
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

        await this.economyService.removeFunds(founderName, GAME_CONFIG.GUILD_CREATION_COST);

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

    /**
     * Retrieves the top guilds sorted by Level, then by Bank Money.
     * @param {number} limit - The maximum number of guilds to return.
     * @returns {Promise<import('../repositories/GuildRepository.js').Guild[]>}
     */
    async getTopGuilds(limit = 10) {
        const guilds = await this.guildRepository.getAll();

        return guilds.toSorted((a, b) => {
            if (b.level !== a.level) {
                return b.level - a.level;
            }
            return b.bankMoney - a.bankMoney;
        }).slice(0, limit);
    }

    /**
     * 
     * @param {string} inviterName 
     * @param {string} targetName 
     * @returns {string}
     */
    async inviteMember(inviterName, targetName) {
        const guilds = await this.guildRepository.getAll();
        const guild = guilds.find(g => g.members.some(m => m.name === inviterName));
        if (!guild) throw new Error("No estás en ningún gremio.");
        
        const inviter = guild.members.find(m => m.name === inviterName);
        if (inviter.rank !== "Leader" && inviter.rank !== "Officer") {
            throw new Error("Solo los líderes u oficiales pueden invitar.");
        }

        const targetInGuild = guilds.some(g => g.members.some(m => m.name === targetName));
        if (targetInGuild) throw new Error("Ese usuario ya pertenece a un gremio.");

        const existingInvite = this.pendingInvites.get(targetName);
        if (existingInvite && Date.now() < existingInvite.expiresAt) {
            throw new Error("El usuario ya tiene una invitación pendiente a otro gremio.");
        }

        this.pendingInvites.set(targetName, {
            guildId: guild.id,
            guildName: guild.name,
            inviterName,
            expiresAt: Date.now() + GAME_CONFIG.INVITE_EXPIRATION
        });
        
        return guild.name;
    }

    /**
     * 
     * @param {string} targetName 
     * @param {boolean} accept 
     * @returns {Promise<string>} The guild name accepted
     * @throws If invite expired, already has a guild o guild doesn't exist
     */
    async resolveInvite(targetName, accept) {
        const invite = this.pendingInvites.get(targetName);
        if (!invite || Date.now() > invite.expiresAt) {
            this.pendingInvites.delete(targetName);
            throw new Error("No tienes invitaciones pendientes o han expirado.");
        }
        
        this.pendingInvites.delete(targetName);
        if (!accept) return false;

        await this.guildRepository.executeTransaction((guilds) => {
            const targetInGuild = guilds.some(g => g.members.some(m => m.name === targetName));
            if (targetInGuild) throw new Error("Ya perteneces a un gremio.");

            const guild = guilds.find(g => g.id === invite.guildId);
            if (!guild) throw new Error("El gremio ha sido disuelto.");

            guild.members.push({ name: targetName, rank: "Member" });
        });

        return invite.guildName;
    }

    /**
     *
     * @param {string} username 
     * @param {number} amount 
     * @returns {Promise<Object<boolean, number>>}
     */
    async donate(username, amount) {
        if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Cantidad inválida.");

        await this.economyService.removeFunds(username, amount);

        let levelUp = false;
        let currentLevel = 0;

        await this.guildRepository.executeTransaction((guilds) => {
            const guild = guilds.find(g => g.members.some(m => m.name === username));
            if (!guild) {
                this.economyService.addFunds(username, amount).catch(console.error);
                throw new Error("No perteneces a ningún gremio.");
            }

            guild.bankMoney += amount;

            const nextLevelCost = GAME_CONFIG.GUILD_LEVEL_COSTS[guild.level + 1];
            if (nextLevelCost && guild.bankMoney >= nextLevelCost) {
                guild.bankMoney -= nextLevelCost;
                guild.level += 1;
                levelUp = true;
            }
            currentLevel = guild.level;
        });

        return { levelUp, currentLevel };
    }

    /**
     * 
     * @param {string} username 
     * @throws if the user doesn't have a guild or is a Leader and has members the guild
     */
    async leaveGuild(username) {
        await this.guildRepository.executeTransaction((guilds) => {
            const guild = guilds.find(g => g.members.some(m => m.name === username));
            if (!guild) throw new Error("No perteneces a ningún gremio.");

            const memberIndex = guild.members.findIndex(m => m.name === username);
            const member = guild.members[memberIndex];

            if (member.rank === "Leader" && guild.members.length > 1) {
                throw new Error("Eres el líder. Debes nombrar otro líder o expulsar a todos antes de salir.");
            }

            guild.members.splice(memberIndex, 1);

            if (guild.members.length === 0) {
                const guildIndex = guilds.findIndex(g => g.id === guild.id);
                guilds.splice(guildIndex, 1);
            }
        });
    }

    /**
     * Retrieves the guild level for a specific user.
     * @param {string} username - The username to check.
     * @returns {Promise<number>} The guild level, or 0 if the user is not in a guild.
     */
    async getUserGuildLevel(username) {
        const guild = await this.getUserGuild(username);
        return guild ? guild.level : 0;
    }
}