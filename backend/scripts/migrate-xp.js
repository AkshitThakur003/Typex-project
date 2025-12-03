/**
 * Migration Script: Backfill XP fields for existing users
 * 
 * Run this once to initialize XP fields for all existing users:
 * node backend/scripts/migrate-xp.js
 * 
 * Or from project root:
 * node -r dotenv/config backend/scripts/migrate-xp.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not set');
  process.exit(1);
}

async function migrateXp() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users without XP fields or with null/undefined values
    const users = await User.find({
      $or: [
        { xp: { $exists: false } },
        { xp: null },
        { level: { $exists: false } },
        { level: null },
        { xpToNext: { $exists: false } },
        { xpToNext: null },
        { totalXp: { $exists: false } },
        { totalXp: null },
      ],
    });

    console.log(`Found ${users.length} users to migrate`);

    let migrated = 0;
    let skipped = 0;

    for (const user of users) {
      // Only update if fields are missing/null
      const needsUpdate = 
        user.xp === null || user.xp === undefined ||
        user.level === null || user.level === undefined ||
        user.xpToNext === null || user.xpToNext === undefined ||
        user.totalXp === null || user.totalXp === undefined;

      if (needsUpdate) {
        await User.findByIdAndUpdate(user._id, {
          $set: {
            xp: user.xp || 0,
            level: user.level || 1,
            xpToNext: user.xpToNext || 100,
            totalXp: user.totalXp || 0,
          },
        });
        migrated++;
        console.log(`Migrated user: ${user.username}`);
      } else {
        skipped++;
      }
    }

    console.log('\nMigration complete!');
    console.log(`Migrated: ${migrated} users`);
    console.log(`Skipped: ${skipped} users (already have XP fields)`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrateXp();

