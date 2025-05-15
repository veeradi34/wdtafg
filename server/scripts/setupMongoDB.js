// server/scripts/setupMongoDB.js
/**
 * This script sets up the MongoDB collections and indexes for the ZeroCode app.
 * Run it once after setting up your MongoDB connection.
 * 
 * Usage:
 * node scripts/setupMongoDB.js
 */

import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
// First try server/.env, then try root .env
const serverEnvPath = resolve(__dirname, '..', '.env');
const rootEnvPath = resolve(__dirname, '..', '..', '.env');

if (fs.existsSync(serverEnvPath)) {
  config({ path: serverEnvPath });
  console.log('Loaded environment from server/.env');
} else if (fs.existsSync(rootEnvPath)) {
  config({ path: rootEnvPath });
  console.log('Loaded environment from root .env');
} else {
  config();
  console.log('No .env file found, using process environment variables');
}

async function setupMongoDB() {
  // Get MongoDB URI from environment variables
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('MONGODB_URI environment variable is not defined');
    process.exit(1);
  }
  
  let client;
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected successfully to MongoDB');
    
    // Get database reference
    const db = client.db('zerocode');
    
    // Create collections if they don't exist
    console.log('Setting up collections...');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes('projects')) {
      await db.createCollection('projects');
      console.log('Created projects collection');
    } else {
      console.log('Projects collection already exists');
    }
    
    if (!collectionNames.includes('generations')) {
      await db.createCollection('generations');
      console.log('Created generations collection');
    } else {
      console.log('Generations collection already exists');
    }
    
    // Create indexes for better performance
    console.log('Setting up indexes...');
    
    // Projects collection indexes
    await db.collection('projects').createIndex({ userId: 1 });
    await db.collection('projects').createIndex({ updatedAt: -1 });
    console.log('Created indexes for projects collection');
    
    // Generations collection indexes
    await db.collection('generations').createIndex({ 
      prompt: 1, 
      'settings.framework': 1,
      'settings.styling': 1,
      'settings.stateManagement': 1 
    });
    await db.collection('generations').createIndex({ lastAccessed: -1 });
    console.log('Created indexes for generations collection');
    
    console.log('MongoDB setup completed successfully!');
  } catch (error) {
    console.error('Error setting up MongoDB:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the setup function
setupMongoDB().catch(console.error);
