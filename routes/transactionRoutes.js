import express from "express";
import { initializeDatabase, getTransactions, getStatistics,getBarChartData ,getPieChartData,getCombinedStats} from "../controllers/transactionController.js";

const router = express.Router();

router.get("/init", initializeDatabase); // Route for initialization
router.get("/", getTransactions); // Route for listing transactions
router.get("/statistics", getStatistics); // ✅ Route for statistics
router.get("/barchart", getBarChartData); // route for barchart
router.get("/piechart", getPieChartData);


router.get("/combined", getCombinedStats);




export default router;
