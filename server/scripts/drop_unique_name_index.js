// Drop the unique index on the `name` field of the classes collection (if present).
// Usage:
//   node server/scripts/drop_unique_name_index.js         # dry-run: lists indexes
//   node server/scripts/drop_unique_name_index.js --confirm  # actually drops the index
// By default this will connect using MONGODB_URI env var if set, otherwise it falls back to the connection string used by the server.

import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || "mongodb+srv://David:FlightWolf@sr-application.otbn587.mongodb.net/";
const confirm = process.argv.includes('--confirm');

async function run() {
  console.log('Connecting to', uri.replace(/(mongodb\+srv:\/\/[^:]+):([^@]+)@/, '$1:****@'));
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db;
  const collName = 'classes';
  const coll = db.collection(collName);
  const indexes = await coll.indexes();
  console.log('Indexes on', collName, indexes);

  const nameIndex = indexes.find((i) => i.key && i.key.name === 1);
  if (!nameIndex) {
    console.log('No index found with key { name: 1 }. Nothing to drop.');
    await mongoose.disconnect();
    return;
  }

  console.log('Found name index:', nameIndex);
  if (!confirm) {
    console.log('\nDry run only. To actually drop the index re-run with --confirm.');
    await mongoose.disconnect();
    return;
  }

  try {
    console.log('Dropping index:', nameIndex.name);
    await coll.dropIndex(nameIndex.name);
    console.log('Index dropped.');
  } catch (err) {
    console.error('Failed to drop index:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
