import { GAME_CONFIG } from "../core/constants.js";
import { Raid } from "../domain/raid/Raid.js";

/**
 * @typedef {import('../core/types.js').RaidSession} RaidProps
 */

export class RaidService {
    /**
     * @param {import('../core/types.js').IEconomyService} economyService - Service to distribute rewards.
     * @param {import('../core/types.js').IBossRepository} bossRepository - Repository for boss variables.
     */
    constructor(economyService, bossRepository) {
        this.economyService = economyService;
        this.bossRepository = bossRepository;

        /** @type {RaidProps|null} */
        this.currentRaid = null;

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
     * @param {import('../core/types.js').ISocketServer} io - Socket.io server instance.
     */
    async startRaid(io) {
        try {
            if (this.currentRaid?.active) return;

            const currentMaxHp = await this.bossRepository.getMaxHp(GAME_CONFIG.BOSS_CONFIG.MAX_HP);

            const raid = new Raid({
                maxHp: currentMaxHp,
                hp: currentMaxHp,
                damageLog: {},
                expiresAt: Date.now() + GAME_CONFIG.BOSS_CONFIG.BOSS_TIME_LIMIT,
                active: true
            });
            this.currentRaid = raid;

            io.emit("activity:raidStarted", {
                host: "El Sistema",
                maxHp: raid.maxHp,
                hp: raid.hp,
                expiresAt: raid.expiresAt,
                timeLimit: GAME_CONFIG.BOSS_CONFIG.BOSS_TIME_LIMIT
            });

            if (this.raidTimeout) clearTimeout(this.raidTimeout);
            this.raidTimeout = setTimeout(async () => {
                if (!this.currentRaid?.active) return;

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
            }, GAME_CONFIG.BOSS_CONFIG.BOSS_TIME_LIMIT);
        } catch (error) {
            console.error("[RaidService] Error starting raid", error);
        }
    }

    /**
     * Processes a hit from a player during the active raid.
     * @param {string} username - The player hitting the boss.
     * @param {import('../core/types.js').ISocketServer} io - Socket.io server instance.
     */
    async hitBoss(username, io) {
        const raid = this.currentRaid;
        if (!raid || !raid.active || raid.hp <= 0) return;

        const damage = Math.floor(Math.random() * GAME_CONFIG.BOSS_CONFIG.DAMAGE_MULTIPLIER) + 1;
        raid.hp -= damage;

        if (!raid.damageLog[username]) {
            raid.damageLog[username] = 0;
        }
        raid.damageLog[username] += damage;

        io.emit("activity:raidSync", {
            hp: raid.hp,
            lastHitBy: username,
            damage
        });

        if (raid.hp <= 0) {
            raid.active = false;
            if (this.raidTimeout) clearTimeout(this.raidTimeout);

            for (const [user, dmg] of Object.entries(raid.damageLog)) {
                const reward = Math.floor(dmg * GAME_CONFIG.BOSS_CONFIG.REWARD_PER_DAMAGE);
                await this.economyService.addFunds(user, reward).catch(console.error);
            }

            io.emit("activity:raidEnded", {
                success: true,
                leaderboard: raid.damageLog
            });

            await this.#adjustBossDifficulty(true);
        }
    }

    /**
     * Returns the current raid data to sync players joining late.
     * @returns {Object|null}
     */
    getSyncData() {
        const raid = this.currentRaid;
        if (!raid?.active) return null;
        return {
            host: "El Sistema",
            maxHp: raid.maxHp,
            hp: raid.hp,
            expiresAt: raid.expiresAt,
            timeLimit: GAME_CONFIG.BOSS_CONFIG.BOSS_TIME_LIMIT
        };
    }
}