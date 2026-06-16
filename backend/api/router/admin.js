import express from "express";
import { container } from "../../core/DIContainer.js";

const router = express.Router();

router.post("/login", container.authController.login);

router.post("/register", container.authController.register);

router.get("/list/users", container.authController.listUsers);

export default router;
