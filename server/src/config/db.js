const mongoose = require("mongoose");

mongoose.set("bufferCommands", false);

const dropStaleUserEmailIndex = async () => {
  const usersCollection = mongoose.connection.collection("users");
  let indexes = [];

  try {
    indexes = await usersCollection.indexes();
  } catch (error) {
    if (error.codeName === "NamespaceNotFound" || error.code === 26) {
      return;
    }

    throw error;
  }

  const staleEmailIndex = indexes.find((index) => index.name === "email_1" && index.unique);

  if (staleEmailIndex) {
    await usersCollection.dropIndex("email_1");
    console.log("Dropped stale users.email unique index");
  }
};

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 20000,
  });
  await dropStaleUserEmailIndex();
  console.log("MongoDB connected");
};

module.exports = connectDB;
