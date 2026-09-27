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

  console.log('--- taxivehicles ---');
  const vehicles = await db.collection('taxivehicles').find({}).toArray();
  for (const v of vehicles) {
    console.log(`ID: ${v._id}, name: ${v.name || v.vehicleName}, type: ${v.vehicleType || v.type}, vehicleTypeId: ${v.vehicleTypeId}`);
  }

  console.log('--- taxirentalvehicletypes ---');
  const types = await db.collection('taxirentalvehicletypes').find({}).toArray();
  for (const t of types) {
    console.log(`ID: ${t._id}, name: ${t.name}, pricing: ${JSON.stringify(t.pricing)}`);
  }

  console.log('--- taxirentalpackagetypes ---');
  const pkgs = await db.collection('taxirentalpackagetypes').find({}).toArray();
  for (const p of pkgs) {
    console.log(JSON.stringify(p));
  }

  await mongoose.disconnect();
}

check().catch(console.error);
