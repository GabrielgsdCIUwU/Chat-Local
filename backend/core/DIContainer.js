import path from "node:path";
import { fileURLToPath } from "node:url";

import { CronManager } from "./CronManager.js";

import { SqliteClient } from "../database/SqliteClient.js";
import { JsonDatabaseClient } from "../database/JsonDatabaseClient.js";

import {
    SqliteUserRepository, SqliteBannedIpRepository, SqliteGamblingRepository,
    SqliteEconomyRepository, SqliteMessageRepository, SqliteInventoryRepository,
    SqliteJobRepository, SqliteAuctionRepository, SqliteGuildRepository, SqlitePetRepository
} from "../repositories/SqliteRepositories.js";

import { AuthService } from "../services/AuthService.js";
import { UserService } from "../services/UserService.js";
import { GamblingService } from "../services/GamblingService.js";
import { EconomyService } from "../services/EconomyService.js";
import { CommandService } from "../services/CommandService.js";
import { EmojiService } from "../services/EmojiService.js";
import { ChatFilterService } from "../services/ChatFilterService.js";
import { RPGService } from "../services/RPGService.js";
import { MarketService } from "../services/MarketService.js";
import { CraftingService } from "../services/CraftingService.js";
import { GuildService } from "../services/GuildService.js";
import { PetService } from "../services/PetService.js";
import { RaidService } from "../services/RaidService.js";

import { AuthController } from "../controllers/AuthController.js";
import { ProfileController } from "../controllers/ProfileController.js";
import { ChatController } from "../controllers/ChatController.js";
import { MediaController } from "../controllers/MediaController.js";
import { BossRepository } from "../repositories/BossRepository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DIContainer {
    constructor() {
        this.profileDir = path.join(__dirname, "../../resources/profiles");
        this.commandsDir = path.join(__dirname, "../../bot/commands");
        this.emojisDir = path.join(__dirname, "../../resources/emojis");

        this.spamJsonPath = path.join(__dirname, "../data/spamer.json");
        this.spamDbClient = new JsonDatabaseClient(this.spamJsonPath);

        this.bossJsonPath = path.join(__dirname, "../data/boss.json");
        this.bossDbClient = new JsonDatabaseClient(this.bossJsonPath);
        this.bossRepository = new BossRepository(this.bossDbClient);

        this.sqliteClient = new SqliteClient();

        this.userRepository = new SqliteUserRepository(this.sqliteClient);
        this.bannedIpRepository = new SqliteBannedIpRepository(this.sqliteClient);
        this.gamblingRepository = new SqliteGamblingRepository(this.sqliteClient);
        this.economyRepository = new SqliteEconomyRepository(this.sqliteClient);
        this.messageRepository = new SqliteMessageRepository(this.sqliteClient);
        this.inventoryRepository = new SqliteInventoryRepository(this.sqliteClient);
        this.jobRepository = new SqliteJobRepository(this.sqliteClient);
        this.auctionRepository = new SqliteAuctionRepository(this.sqliteClient);
        this.guildRepository = new SqliteGuildRepository(this.sqliteClient);
        this.petRepository = new SqlitePetRepository(this.sqliteClient);

        // Base Services
        this.economyService = new EconomyService(this.economyRepository);
        this.commandService = new CommandService(this.commandsDir);
        this.emojiService = new EmojiService(this.emojisDir);
        this.chatFilterService = new ChatFilterService(this.spamDbClient);
        this.authService = new AuthService(this.userRepository, this.bannedIpRepository);
        this.userService = new UserService(this.userRepository, this.profileDir);
        
        // Mid-level Services
        this.petService = new PetService(this.petRepository, this.economyService);
        this.guildService = new GuildService(this.economyService, this.guildRepository);
        this.craftingService = new CraftingService(this.inventoryRepository, this.jobRepository);
        this.marketService = new MarketService(this.economyService, this.inventoryRepository, this.auctionRepository);
        this.raidService = new RaidService(this.economyService, this.bossRepository);

        // High-level Services
        this.gamblingService = new GamblingService(
            this.gamblingRepository,
            this.economyService,
            this.petService,
            this.guildService,
            this.craftingService
        );
        this.rpgService = new RPGService(
            this.economyService,
            this.inventoryRepository,
            this.jobRepository,
            this.petService
        );

        this.authController = new AuthController(this.authService, this.userRepository);
        this.profileController = new ProfileController(this.userService);
        this.chatController = new ChatController(this.commandService);
        this.mediaController = new MediaController(this.emojiService);

        this.cronManager = new CronManager(this.marketService, this.rpgService, this.raidService);
    }
}

export const container = new DIContainer();