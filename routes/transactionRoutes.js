import express from "express";
import { initializeDatabase } from "../controllers/transactionController.js";

const router = express.Router();

// Route to initialize database
router.get("/init", initializeDatabase);

export default router;
