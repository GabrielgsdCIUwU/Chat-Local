import path from "node:path";
import { fileURLToPath } from "node:url";

import { JsonDatabaseClient } from "../database/JsonDatabaseClient.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { BannedIpRepository } from "../repositories/BannedIpRepository.js";
import { GamblingRepository } from "../repositories/GamblingRepository.js";
import { MessageRepository } from "../repositories/MessageRepository.js";

import { AuthService } from "../services/AuthService.js";
import { UserService } from "../services/UserService.js";
import { GamblingService } from "../services/GamblingService.js";
import { CommandService } from "../services/CommandService.js";
import { EmojiService } from "../services/EmojiService.js";
import { ChatFilterService } from "../services/ChatFilterService.js";

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
        this.messagesJsonPath = path.join(__dirname, "../data/messages.json");
        this.profileDir = path.join(__dirname, "../../resources/profiles");
        this.commandsDir = path.join(__dirname, "../../bot/commands");
        this.emojisDir = path.join(__dirname, "../../resources/emojis");
        this.spamJsonPath = path.join(__dirname, "../data/spamer.json");

        this.userDbClient = new JsonDatabaseClient(this.usersJsonPath);
        this.bannedDbClient = new JsonDatabaseClient(this.bannedJsonPath);
        this.gamblingDbClient = new JsonDatabaseClient(this.gamblingJsonPath);
        this.messageDbClient = new JsonDatabaseClient(this.messagesJsonPath);
        this.spamDbClient = new JsonDatabaseClient(this.spamJsonPath);

        this.userRepository = new UserRepository(this.userDbClient);
        this.bannedIpRepository = new BannedIpRepository(this.bannedDbClient);
        this.gamblingRepository = new GamblingRepository(this.gamblingDbClient);
        this.messageRepository = new MessageRepository(this.messageDbClient);

        this.authService = new AuthService(this.userRepository, this.bannedIpRepository);
        this.userService = new UserService(this.userRepository, this.profileDir);
        this.gamblingService = new GamblingService(this.gamblingRepository);
        this.commandService = new CommandService(this.commandsDir);
        this.emojiService = new EmojiService(this.emojisDir);
        this.chatFilterService = new ChatFilterService(this.spamDbClient);

        this.authController = new AuthController(this.authService, this.userRepository);
        this.profileController = new ProfileController(this.userService);
        this.chatController = new ChatController(this.commandService);
        this.mediaController = new MediaController(this.emojiService);
    }
}

export const container = new DIContainer();