const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;

  console.log(`Connecting to database ${dbName}...`);
  const conn = await mysql.createConnection({ host, user, password, database: dbName });

  try {
    console.log('Updating admin user account details in DB...');
    const [result] = await conn.query(
      "UPDATE users SET name = 'iBTIDAA Admin', email = 'admin@ibtidaa.pk' WHERE email = 'admin@givehope.org' OR role = 'admin'"
    );

    console.log('Database updated successfully! Affected rows:', result.affectedRows);

  } catch (err) {
    console.error('Error running script:', err.message);
  } finally {
    await conn.end();
  }
}

run();
