const dns = require('dns');
const mongoose = require('mongoose');
const { getMongoUri, isVercel } = require('./env');
const { getResolvedMongoUri } = require('./resolveMongoUri');

if (isVercel && typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

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
    const resolvedUri = await getResolvedMongoUri();

    cached.promise = mongoose
      .connect(resolvedUri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: isVercel ? 30000 : 10000,
        connectTimeoutMS: isVercel ? 30000 : 10000,
        maxPoolSize: isVercel ? 5 : 10,
        ...(isVercel ? {} : { family: 4 }),
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
