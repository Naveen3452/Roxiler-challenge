import Transaction from "../models/Transaction.js";


export const initializeDatabase = async (req, res) => {
    try {
      console.log("Fetching data from API...");
  
      // Fetch transactions from API
      const response = await axios.get("https://s3.amazonaws.com/roxiler.com/product_transaction.json");
      const transactions = response.data;
  
      // Prevent duplicates: Delete all existing data before inserting
      await Transaction.deleteMany();
  
      // Insert new transactions
      await Transaction.insertMany(transactions);
  
      res.status(200).json({ message: "Database initialized successfully!" });
    } catch (error) {
      console.error("Error initializing database:", error);
      res.status(500).json({ message: "Error initializing database", error });
    }
  };
  


  export const getStatistics = async (req, res) => {
    try {
      const { month } = req.query;
  
      // Convert month name to number
      const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;
  
      // Filter by month (ignoring year)
      const matchQuery = { $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] } };
  
      // Get total sale amount
      const totalSale = await Transaction.aggregate([
        { $match: matchQuery },
        { $match: { sold: true } },
        { $group: { _id: null, totalAmount: { $sum: "$price" } } }
      ]);
  
      // Get total number of sold and unsold items
      const soldCount = await Transaction.countDocuments({ ...matchQuery, sold: true });
      const unsoldCount = await Transaction.countDocuments({ ...matchQuery, sold: false });
  
      res.status(200).json({
        totalSaleAmount: totalSale.length > 0 ? totalSale[0].totalAmount : 0,
        totalSoldItems: soldCount,
        totalUnsoldItems: unsoldCount
      });
    } catch (error) {
      console.error("❌ Error in getStatistics:", error); // Log full error in the terminal
      res.status(500).json({ message: "Error fetching statistics", error: error.message });
    }
  };
  
  

  export const getTransactions = async (req, res) => {
    try {
      const { month, search, page = 1, perPage = 10 } = req.query;
  
      // Convert month name to number (e.g., "March" → 3)
      const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;
  
      // Filter by month (ignoring year)
      const matchQuery = { $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] } };
  
      // Apply search filter if provided
      if (search) {
        matchQuery.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { price: parseFloat(search) || 0 }
        ];
      }
  
      // Pagination calculation
      const skip = (page - 1) * perPage;
  
      // Fetch transactions from MongoDB
      const transactions = await Transaction.find(matchQuery).skip(skip).limit(parseInt(perPage));
  
      // Get total count for pagination info
      const total = await Transaction.countDocuments(matchQuery);
  
      res.status(200).json({
        total,
        page: parseInt(page),
        perPage: parseInt(perPage),
        totalPages: Math.ceil(total / perPage),
        transactions
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions", error });
    }
  };
  

  export const getBarChartData = async (req, res) => {
    try {
      const { month } = req.query;
  
      // Convert month name to number
      const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;
  
      // Filter transactions by month (ignoring year)
      const matchQuery = { $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] } };
  
      // Aggregate data to count items in each price range
      const priceRanges = await Transaction.aggregate([
        { $match: matchQuery },
        {
          $bucket: {
            groupBy: "$price",
            boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, Infinity],
            default: "901+",
            output: { count: { $sum: 1 } }
          }
        }
      ]);
  
      res.status(200).json(priceRanges);
    } catch (error) {
      console.error("❌ Error in getBarChartData:", error);
      res.status(500).json({ message: "Error fetching bar chart data", error: error.message });
    }
  };

  
  export const getPieChartData = async (req, res) => {
    try {
      const { month } = req.query;
  
      // Convert month name to number
      const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;
  
      // Filter transactions by month (ignoring year)
      const matchQuery = { $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] } };
  
      // Aggregate data to count items per category
      const categoryCounts = await Transaction.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ]);
  
      // Convert the result into an object for easier frontend use
      const formattedData = {};
      categoryCounts.forEach(({ _id, count }) => {
        formattedData[_id] = count;
      });
  
      res.status(200).json(formattedData);
    } catch (error) {
      console.error("❌ Error in getPieChartData:", error);
      res.status(500).json({ message: "Error fetching pie chart data", error: error.message });
    }
  };

  



  export const getCombinedStats = async (req, res) => {
    try {
      const { month } = req.query;
  
      // Convert month name to number
      const monthNumber = new Date(`${month} 1, 2000`).getMonth() + 1;
  
      // Filter transactions by month (ignoring year)
      const matchQuery = { $expr: { $eq: [{ $month: "$dateOfSale" }, monthNumber] } };
  
      // 1️⃣ Get total sales & sold/unsold counts
      const totalSale = await Transaction.aggregate([
        { $match: matchQuery },
        { $match: { sold: true } },
        { $group: { _id: null, totalAmount: { $sum: "$price" } } }
      ]);
      const soldCount = await Transaction.countDocuments({ ...matchQuery, sold: true });
      const unsoldCount = await Transaction.countDocuments({ ...matchQuery, sold: false });
  
      // 2️⃣ Get bar chart data (price ranges)
      const priceRanges = await Transaction.aggregate([
        { $match: matchQuery },
        {
          $bucket: {
            groupBy: "$price",
            boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, Infinity],
            default: "901+",
            output: { count: { $sum: 1 } }
          }
        }
      ]);
  
      // 3️⃣ Get pie chart data (category counts)
      const categoryCounts = await Transaction.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ]);
      const formattedCategories = {};
      categoryCounts.forEach(({ _id, count }) => {
        formattedCategories[_id] = count;
      });
  
      res.status(200).json({
        statistics: {
          totalSaleAmount: totalSale.length > 0 ? totalSale[0].totalAmount : 0,
          totalSoldItems: soldCount,
          totalUnsoldItems: unsoldCount
        },
        barChart: priceRanges,
        pieChart: formattedCategories
      });
    } catch (error) {
      console.error("❌ Error in getCombinedStats:", error);
      res.status(500).json({ message: "Error fetching combined stats", error: error.message });
    }
  };
  