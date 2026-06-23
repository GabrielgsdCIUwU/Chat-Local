import path from "node:path";
import { fileURLToPath } from "node:url";

import { CronManager } from "./CronManager.js";

import { JsonDatabaseClient } from "../database/JsonDatabaseClient.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { BannedIpRepository } from "../repositories/BannedIpRepository.js";
import { GamblingRepository } from "../repositories/GamblingRepository.js";
import { EconomyRepository } from "../repositories/EconomyRepository.js";
import { MessageRepository } from "../repositories/MessageRepository.js";
import { InventoryRepository } from "../repositories/InventoryRepository.js";
import { JobRepository } from "../repositories/JobRepository.js";
import { AuctionRepository } from "../repositories/AuctionRepository.js";
import { GuildRepository } from "../repositories/GuildRepository.js";
import { PetRepository } from "../repositories/PetRepository.js";

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

import { AuthController } from "../controllers/AuthController.js";
import { ProfileController } from "../controllers/ProfileController.js";
import { ChatController } from "../controllers/ChatController.js";
import { MediaController } from "../controllers/MediaController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DIContainer {
    constructor() {
        this.usersJsonPath = path.join(__dirname, "../data/users.json");
        this.bannedJsonPath = path.join(__dirname, "../data/usersban.json");
        this.gamblingJsonPath = path.join(__dirname, "../data/gambling.json");
        this.economyJsonPath = path.join(__dirname, "../data/economy.json");
        this.messagesJsonPath = path.join(__dirname, "../data/messages.json");
        this.profileDir = path.join(__dirname, "../../resources/profiles");
        this.commandsDir = path.join(__dirname, "../../bot/commands");
        this.emojisDir = path.join(__dirname, "../../resources/emojis");
        this.spamJsonPath = path.join(__dirname, "../data/spamer.json");
        this.inventoryJsonPath = path.join(__dirname, "../data/inventory.json");
        this.jobsJsonPath = path.join(__dirname, "../data/jobs.json");
        this.auctionsJsonPath = path.join(__dirname, "../data/auctions.json");
        this.guildsJsonPath = path.join(__dirname, "../data/guilds.json");
        this.petsJsonPath = path.join(__dirname, "../data/pets.json");

        this.userDbClient = new JsonDatabaseClient(this.usersJsonPath);
        this.bannedDbClient = new JsonDatabaseClient(this.bannedJsonPath);
        this.gamblingDbClient = new JsonDatabaseClient(this.gamblingJsonPath);
        this.economyDbClient = new JsonDatabaseClient(this.economyJsonPath);
        this.messageDbClient = new JsonDatabaseClient(this.messagesJsonPath);
        this.spamDbClient = new JsonDatabaseClient(this.spamJsonPath);
        this.inventoryDbClient = new JsonDatabaseClient(this.inventoryJsonPath);
        this.jobsDbClient = new JsonDatabaseClient(this.jobsJsonPath);
        this.auctionsDbClient = new JsonDatabaseClient(this.auctionsJsonPath);
        this.guildsDbClient = new JsonDatabaseClient(this.guildsJsonPath);
        this.petsDbClient = new JsonDatabaseClient(this.petsJsonPath);

        this.userRepository = new UserRepository(this.userDbClient);
        this.bannedIpRepository = new BannedIpRepository(this.bannedDbClient);
        this.gamblingRepository = new GamblingRepository(this.gamblingDbClient);
        this.economyRepository = new EconomyRepository(this.economyDbClient);
        this.messageRepository = new MessageRepository(this.messageDbClient);
        this.inventoryRepository = new InventoryRepository(this.inventoryDbClient);
        this.jobRepository = new JobRepository(this.jobsDbClient);
        this.auctionRepository = new AuctionRepository(this.auctionsDbClient);
        this.guildRepository = new GuildRepository(this.guildsDbClient);
        this.petRepository = new PetRepository(this.petsDbClient);

        // Base Services (No dependencies or just repositories)
        this.economyService = new EconomyService(this.economyRepository);
        this.commandService = new CommandService(this.commandsDir);
        this.emojiService = new EmojiService(this.emojisDir);
        this.chatFilterService = new ChatFilterService(this.spamDbClient);
        this.authService = new AuthService(this.userRepository, this.bannedIpRepository);
        this.userService = new UserService(this.userRepository, this.profileDir);
        
        // Mid-level Services (Depend on Base Services)
        this.petService = new PetService(this.petRepository, this.economyService);
        this.guildService = new GuildService(this.economyService, this.guildRepository);
        this.craftingService = new CraftingService(this.inventoryRepository, this.jobRepository);
        this.marketService = new MarketService(this.economyService, this.inventoryRepository, this.auctionRepository);

        // High-level Services (Depend on Mid-level and Base Services)
        this.gamblingService = new GamblingService(this.gamblingRepository, this.economyService, this.petService, this.guildService);
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

        this.cronManager = new CronManager(this.marketService, this.rpgService);
    }
}

export const container = new DIContainer();