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
  const targetId = new mongoose.Types.ObjectId('69f081d44575dc1008f0c89a');
  const collections = await db.listCollections().toArray();
  
  console.log(`Searching for ID: ${targetId} across all collections...`);
  
  for (const col of collections) {
    const doc = await db.collection(col.name).findOne({ _id: targetId });
    if (doc) {
      console.log(`Found in collection: ${col.name}`);
      console.log(JSON.stringify(doc, null, 2));
    }
    
    // Also search fields that might reference it
    const references = await db.collection(col.name).find({
      $or: [
        { vehicleTypeId: targetId },
        { vehicleId: targetId },
        { assignedVehicleId: targetId }
      ]
    }).toArray();
    if (references.length > 0) {
      console.log(`Found ${references.length} references in collection: ${col.name}`);
    }
  }
  
  await mongoose.disconnect();
}

check().catch(console.error);
