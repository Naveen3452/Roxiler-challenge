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
  