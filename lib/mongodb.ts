import mongoose from 'mongoose';

// Extend the NodeJS global interface to include mongoose
declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Mongoose> | null;
  } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = globalThis.mongoose as
  | { conn: mongoose.Connection | null; promise: Promise<mongoose.Mongoose> | null }
  | undefined;

if (!cached) {
  cached = globalThis.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = { bufferCommands: false };

    cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((m) => m);
  }

  const mongoose_instance = await cached!.promise;
  cached!.conn = mongoose_instance.connection;
  return cached!.conn;
}

export default dbConnect;
