import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function clearDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get database instance
        const db = mongoose.connection.db;

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log(`📋 Found ${collections.length} collections:`);

        collections.forEach(collection => {
            console.log(`   - ${collection.name}`);
        });

        // Clear each collection
        console.log('\n🗑️ Clearing all collections...');

        for (const collection of collections) {
            const collectionName = collection.name;
            const result = await db.collection(collectionName).deleteMany({});
            console.log(`   ✅ Cleared ${collectionName}: ${result.deletedCount} documents deleted`);
        }

        console.log('\n🎉 Database cleared successfully!');
        console.log('🔄 The system will now start fresh with proper duplicate checking.');

    } catch (error) {
        console.error('❌ Error clearing database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the script
console.log('🚨 DATABASE CLEAR SCRIPT');
console.log('This will permanently delete ALL data in your database.');
console.log('Make sure this is what you want to do!');
console.log('\nStarting in 3 seconds...');

setTimeout(() => {
    clearDatabase();
}, 3000);
