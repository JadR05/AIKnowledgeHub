import mongoose from "mongoose";

let cachedConnection = null;

export const connectToDatabase = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  cachedConnection = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 1,
    socketTimeoutMS: 45000,
  });

  console.log("Connected to MongoDB");
  return cachedConnection;
};