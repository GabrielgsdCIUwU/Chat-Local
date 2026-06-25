import { GAME_CONFIG } from "../core/constants.js";

/**
 * @typedef {Object} RaidSession
 * @property {boolean} active - Indicates if a raid is currently running.
 * @property {number} hp - Current health points of the boss.
 * @property {number} maxHp - Maximum health points of the boss.
 * @property {Object.<string, number>} damageLog - Tracks damage dealt by each username.
 * @property {number} expiresAt - Timestamp when the boss end.
 * @property {number} timeLimit - MAX seconds of the boss.
 */

export class RaidService {
    /**
     * @param {import('./EconomyService.js').EconomyService} economyService - Service to distribute rewards.
     * @param {import('../repositories/BossRepository.js').BossRepository} bossRepository - Repository for boss variables.
     */
    constructor(economyService, bossRepository) {
        this.economyService = economyService;
        this.bossRepository = bossRepository;

        /** @type {RaidSession} */
        this.currentRaid = {
            active: false,
            hp: 0,
            maxHp: 0,
            damageLog: {}
        };

        /** @type {NodeJS.Timeout | null} */
        this.raidTimeout = null;
    }

    /**
     * Modifies the maximum HP based on the result of the previous battle and persists it.
     * @param {boolean} won - True if the boss was defeated, false if it escaped.
     * @returns {Promise<void>}
     */
    async #adjustBossDifficulty(won) {
        let maxHp = await this.bossRepository.getMaxHp(GAME_CONFIG.BOSS_CONFIG.MAX_HP);
        
        if (won) {
            maxHp = Math.floor(maxHp * 1.25);
        } else {
            maxHp = Math.floor(maxHp * 0.7);
        }

        // Hard limits to prevent it from going to infinity or zero
        if (maxHp < 1000) maxHp = 1000;

        await this.bossRepository.setMaxHp(maxHp);
    }

    /**
     * Starts a new global Raid event. Called by the CronManager.
     * @param {import('socket.io').Server} io - Socket.io server instance.
     */
    async startRaid(io) {
        try {
            if (this.currentRaid.active) return;

            const currentMaxHp = await this.bossRepository.getMaxHp(GAME_CONFIG.BOSS_CONFIG.MAX_HP);

            this.currentRaid.active = true;
            this.currentRaid.maxHp = currentMaxHp;
            this.currentRaid.hp = currentMaxHp; 
            this.currentRaid.damageLog = {};
            this.currentRaid.expiresAt = Date.now() + GAME_CONFIG.BOSS_CONFIG.BOSS_TIME_LIMIT;

            io.emit("activity:raidStarted", {
                host: "El Sistema",
                maxHp: this.currentRaid.maxHp,
                hp: this.currentRaid.hp,
                expiresAt: this.currentRaid.expiresAt,
                timeLimit: GAME_CONFIG.BOSS_CONFIG.BOSS_TIME_LIMIT
            });

            if (this.raidTimeout) clearTimeout(this.raidTimeout);
            this.raidTimeout = setTimeout(async () => {
                if (this.currentRaid.active) {
                    this.currentRaid.active = false;
                    
                    const participants = Object.keys(this.currentRaid.damageLog);
                    const penalty = Math.floor(this.currentRaid.maxHp * 0.1) || 100;
                    
                    for (const user of participants) {
                        await this.economyService.forceRemoveFunds(user, penalty).catch(console.error);
                    }

                    io.emit("activity:raidEnded", { 
                        success: false, 
                        host: "El Sistema",
                        penalty 
                    });

                    await this.#adjustBossDifficulty(false);
                }
            }, GAME_CONFIG.BOSS_CONFIG.BOSS_TIME_LIMIT);
        } catch (error) {
            console.error("[RaidService] Error starting raid", error);
        }
    }

    /**
     * Processes a hit from a player during the active raid.
     * @param {string} username - The player hitting the boss.
     * @param {import('socket.io').Server} io - Socket.io server instance.
     */
    async hitBoss(username, io) {
        if (!this.currentRaid.active || this.currentRaid.hp <= 0) return;

        const damage = Math.floor(Math.random() * GAME_CONFIG.BOSS_CONFIG.DAMAGE_MULTIPLIER) + 1;
        this.currentRaid.hp -= damage;

        if (!this.currentRaid.damageLog[username]) {
            this.currentRaid.damageLog[username] = 0;
        }
        this.currentRaid.damageLog[username] += damage;

        io.emit("activity:raidSync", {
            hp: this.currentRaid.hp,
            lastHitBy: username,
            damage
        });

        if (this.currentRaid.hp <= 0) {
            this.currentRaid.active = false;
            if (this.raidTimeout) clearTimeout(this.raidTimeout);

            for (const [user, dmg] of Object.entries(this.currentRaid.damageLog)) {
                const reward = Math.floor(dmg * GAME_CONFIG.BOSS_CONFIG.REWARD_PER_DAMAGE);
                await this.economyService.addFunds(user, reward).catch(console.error);
            }

            io.emit("activity:raidEnded", {
                success: true,
                leaderboard: this.currentRaid.damageLog
            });

            await this.#adjustBossDifficulty(true);
        }
    }

    /**
     * Returns the current raid data to sync players joining late.
     * @returns {Object|null}
     */
    getSyncData() {
        if (!this.currentRaid.active) return null;
        return {
            host: "El Sistema",
            maxHp: this.currentRaid.maxHp,
            hp: this.currentRaid.hp,
            expiresAt: this.currentRaid.expiresAt,
            timeLimit: GAME_CONFIG.BOSS_CONFIG.BOSS_TIME_LIMIT
        };
    }
}