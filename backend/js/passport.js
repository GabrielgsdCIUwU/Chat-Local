import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';
import passport from 'passport';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../");
const envFilePath = path.join(rootDir, ".env");
dotenv.config({ path: envFilePath });

passport.use(
    
)