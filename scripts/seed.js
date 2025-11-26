#!/usr/bin/env node

/**
 * Database seed script - Creates initial admin user
 * Usage: node scripts/seed.js
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('Please create a .env.local file with DATABASE_URL=postgresql://...');
  process.exit(1);
}

async function seedDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Check if admin user already exists
    const existingAdmin = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@company.com']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('ℹ️  Admin user already exists');
      return;
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(
      `INSERT INTO users (email, password_hash, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'admin@company.com',
        hashedPassword,
        'System Administrator',
        'admin',
        true
      ]
    );

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@company.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login!');

    // Create sample departments
    console.log('\n📁 Creating sample departments...');
    
    const departments = [
      { code: 'IT', name: 'Information Technology', description: 'IT Department' },
      { code: 'HR', name: 'Human Resources', description: 'HR Department' },
      { code: 'FIN', name: 'Finance', description: 'Finance Department' },
      { code: 'OPS', name: 'Operations', description: 'Operations Department' },
      { code: 'SALES', name: 'Sales', description: 'Sales Department' },
    ];

    for (const dept of departments) {
      const existing = await client.query(
        'SELECT id FROM departments WHERE code = $1',
        [dept.code]
      );

      if (existing.rows.length === 0) {
        await client.query(
          'INSERT INTO departments (code, name, description) VALUES ($1, $2, $3)',
          [dept.code, dept.name, dept.description]
        );
        console.log(`  ✅ Created department: ${dept.name}`);
      } else {
        console.log(`  ⏭️  Department ${dept.name} already exists`);
      }
    }

    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run seed
seedDatabase();