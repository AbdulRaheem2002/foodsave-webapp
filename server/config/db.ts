import mongoose from 'mongoose';

let pendingConnection: Promise<boolean> | null = null;

export const isMongoConnected = (): boolean => mongoose.connection.readyState === 1;

/** Ensures MongoDB Atlas connection once per server/serverless worker lifecycle. */
export const connectDB = async (): Promise<boolean> => {
  if (isMongoConnected()) return true;
  if (pendingConnection) return pendingConnection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('ℹ️ MONGODB_URI not provided. Operating in local In-Memory MERN Database mode.');
    return false;
  }

  pendingConnection = (async () => {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`✅ [MongoDB Atlas] Connected successfully to host: ${conn.connection.host}`);
      console.log(`📊 Database: ${conn.connection.name}`);
      return true;
    } catch (error: any) {
      console.log('⚠️ [MongoDB Atlas] Connection notice:', error?.message || error);
      console.log('ℹ️ Tip: Ensure IP 0.0.0.0/0 is added in MongoDB Atlas Network Access.');
      return false;
    } finally {
      pendingConnection = null;
    }
  })();

  return pendingConnection;
};
