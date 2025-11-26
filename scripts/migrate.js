#!/usr/bin/env node

/**
 * Simple database migration script
 * Usage: node scripts/migrate.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('Please create a .env.local file with DATABASE_URL=postgresql://...');
  process.exit(1);
}

async function runMigrations() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Found ${files.length} migration file(s)`);

    for (const file of files) {
      // Check if migration has already been run
      const result = await client.query(
        'SELECT filename FROM migrations WHERE filename = $1',
        [file]
      );

      if (result.rows.length > 0) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      // Run migration
      console.log(`🔧 Running migration: ${file}`);
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      try {
        await client.query(sql);
        
        // Record successful migration
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [file]
        );
        
        console.log(`✅ Successfully executed ${file}`);
      } catch (error) {
        console.error(`❌ Error executing ${file}:`, error.message);
        throw error;
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migrations
runMigrations();