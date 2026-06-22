const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function runSetup() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'givehope_db';

  console.log(`Attempting connection to MySQL server at ${host} as ${user}...`);

  // Connection without database first (to create db if not exists)
  let conn;
  try {
    conn = await mysql.createConnection({
      host,
      user,
      password,
    });
    console.log('Successfully connected to MySQL server.');
  } catch (error) {
    console.error('\n[ERROR] Connection failed! Please make sure your MySQL credentials in server/.env are correct.');
    console.error('MySQL Error Details:', error.message);
    process.exit(1);
  }

  try {
    // 1. Create Database
    console.log(`Creating database "${dbName}" if it doesn't exist...`);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`Database "${dbName}" created/verified.`);

    // Switch to the database
    await conn.query(`USE \`${dbName}\`;`);

    // 2. Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`Reading SQL schema definitions from ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL by semicolon, clean commands, and filter empty ones
    // We replace multi-line comments and single line comments to avoid syntax execution issues
    const cleanSql = schemaSql
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/--.*?\n/g, '')         // Remove single-line comments
      .trim();

    const sqlStatements = cleanSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    console.log(`Executing ${sqlStatements.length} schema statements...`);

    for (let statement of sqlStatements) {
      // Avoid executing USE statements again
      if (statement.toLowerCase().startsWith('use') || statement.toLowerCase().startsWith('create database')) {
        continue;
      }
      try {
        await conn.query(statement);
      } catch (sqlErr) {
        // Log query and error, but don't halt if table already exists
        if (sqlErr.message.includes('already exists')) {
          console.log(`Note: Object already exists (skipped).`);
        } else {
          console.error(`Error executing: ${statement.substring(0, 50)}...`);
          console.error('Details:', sqlErr.message);
        }
      }
    }

    // Dynamic Alter Check for video_url column in success_stories
    try {
      console.log('Verifying success_stories columns structure...');
      const [columns] = await conn.query('SHOW COLUMNS FROM success_stories LIKE "video_url"');
      if (columns.length === 0) {
        console.log('Adding missing column "video_url" to "success_stories"...');
        await conn.query('ALTER TABLE success_stories ADD COLUMN video_url VARCHAR(1000) DEFAULT "" AFTER image_url;');
        console.log('Column "video_url" added successfully.');
      } else {
        console.log('Column "video_url" is already verified.');
      }
    } catch (alterErr) {
      console.error('Failed to run schema alter check:', alterErr.message);
    }

    console.log('\n==================================================');
    console.log('🎉 GiveHope database setup completed successfully! 🎉');
    console.log('==================================================');

  } catch (err) {
    console.error('Database setup error occurred:', err.message);
  } finally {
    if (conn) await conn.end();
  }
}

runSetup();
