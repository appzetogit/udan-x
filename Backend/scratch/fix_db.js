import mongoose from 'mongoose';
import { env } from '../src/config/env.js';

const connect = async () => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== 'production',
    dbName: env.mongoDbName,
  });
};

async function run() {
  await connect();
  const db = mongoose.connection.db;

  // 1. Insert/update vehicle type in taxirentalvehicletypes
  const vehicleTypeId = new mongoose.Types.ObjectId('69f081d44575dc1008f0c89a');
  const vehicleTypeDoc = {
    _id: vehicleTypeId,
    name: 'Honda Amaze',
    vehicleCategory: 'Car',
    pricing: [
      {
        id: 'pkg-1777878307006',
        label: '1 Hour',
        durationHours: 1,
        price: 200,
        extraHourPrice: 150,
        extraKmPrice: 15,
        active: true
      }
    ],
    status: 'active',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const res1 = await db.collection('taxirentalvehicletypes').replaceOne(
    { _id: vehicleTypeId },
    vehicleTypeDoc,
    { upsert: true }
  );
  console.log('Vehicle type upsert result:', res1);

  // 2. Update active booking in taxirentalbookingrequests
  const activeBookingId = new mongoose.Types.ObjectId('6a0181ffdd93e4281cb979b7');
  const res2 = await db.collection('taxirentalbookingrequests').updateOne(
    { _id: activeBookingId },
    {
      $set: {
        'selectedPackage.extraHourPrice': 150,
        // Let's also update the totalCost / advancePaid if needed, but 500 payableNow is fine
      }
    }
  );
  console.log('Active booking update result:', res2);

  await mongoose.disconnect();
}

run().catch(console.error);
