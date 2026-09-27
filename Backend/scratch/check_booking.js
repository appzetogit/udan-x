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

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('COLLECTIONS IN DB:');
  for (const c of collections) {
    console.log(`- ${c.name}`);
  }

  console.log('\nQUERYING RAW taxirentalvehicletypes COLLECTION:');
  const rawTypes = await mongoose.connection.db.collection('taxirentalvehicletypes').find({}).toArray();
  console.log(`Found ${rawTypes.length} documents:`);
  for (const t of rawTypes) {
    console.log(JSON.stringify(t, null, 2));
  }

  console.log('\nQUERYING RAW rentalbookingrequests:');
  const rawBookings = await mongoose.connection.db.collection('taxirentalbookingrequests').find({}).toArray();
  console.log(`Found ${rawBookings.length} bookings:`);
  for (const b of rawBookings) {
    console.log(`Booking ID: ${b._id}, status: ${b.status}, selectedPackage: ${JSON.stringify(b.selectedPackage)}, vehicleTypeId: ${b.vehicleTypeId}`);
  }

  await mongoose.disconnect();
}

check().catch(console.error);
