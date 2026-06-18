const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const COMMON_PASSWORDS = [
  '',          // Blank
  'root',
  '1234',
  '123456',
  '12345678',
  'admin',
  'password',
  'mysql',
  'root123',
  '123'
];

async function findPassword() {
  const host = 'localhost';
  const user = 'root';

  console.log('Testing common default passwords to connect to your local MySQL...');

  for (const password of COMMON_PASSWORDS) {
    try {
      const conn = await mysql.createConnection({
        host,
        user,
        password,
      });

      console.log(`\n🎉 SUCCESS! Connected to MySQL with password: "${password}"`);
      await conn.end();

      // Automatically update the .env file with the correct password
      const envPath = path.join(__dirname, '..', '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Replace DB_PASSWORD line
        envContent = envContent.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${password}`);
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log(`Updated server/.env file with DB_PASSWORD=${password}`);
      }

      process.exit(0);
    } catch (err) {
      // If access denied due to wrong password, continue
      if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log(`Tested password "${password}": Access Denied`);
      } else {
        // If MySQL server is not running or other network error
        console.error(`Connection error on tested password "${password}":`, err.message);
        process.exit(1);
      }
    }
  }

  console.log('\n❌ Could not find the correct MySQL password. Please try resetting it or find your configuration.');
  process.exit(1);
}

findPassword();
