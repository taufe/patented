const mongoose = require('mongoose');
const { getMongoUri } = require('./env');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured on the server');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongoUri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
        family: 4,
      })
      .then((mongooseInstance) => {
        console.log(`MongoDB connected: ${mongooseInstance.connection.host}`);
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
