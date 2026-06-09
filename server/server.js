require("dotenv").config();

const app = require("./app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      const requiredEnv = ["MONGODB_URI", "AUTH_TOKEN_SECRET", "CORS_ORIGIN"];
      const missingEnv = requiredEnv.filter((key) => !process.env[key]);

      if (missingEnv.length > 0) {
        throw new Error(`Missing required production environment variables: ${missingEnv.join(", ")}`);
      }
    }

    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
