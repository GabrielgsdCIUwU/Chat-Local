import express from "express";
import { container } from "../../core/DIContainer.js";
import { isAuthenticated } from "./middlewares/isAuthenticated.js";
import { isAdmin } from "./middlewares/isAdmin.js";

const router = express.Router();

router.post("/login", container.authController.login);

router.post("/register", container.authController.register);

router.get("/list/users", container.authController.listUsers);

router.post("/list/users/roles", isAuthenticated, isAdmin, container.authController.assignRoles);

export default router;
