import mongoose from 'mongoose';
import { env } from '../src/config/env.js';

const connect = async () => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== 'production',
    dbName: env.mongoDbName,
  });
};

async function check() {
  await connect();
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    if (count > 0) {
      console.log(`${col.name}: ${count}`);
    }
  }
  await mongoose.disconnect();
}

check().catch(console.error);
