import { Pool } from 'pg';

const dbUser = process.env.POSTGRES_USER;
const dbHost = process.env.POSTGRES_HOST;
const dbName = process.env.POSTGRES_DB;
const dbPassword = process.env.POSTGRES_PASSWORD;
const dbPort = process.env.POSTGRES_PORT;

let pool;

try {
  pool = new Pool({
    user: dbUser,
    host: dbHost,
    database: dbName,
    password: dbPassword,
    port: parseInt(dbPort, 10),
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.connect()
    .then(() => {
      console.log('Connected to PostgreSQL database');
    })
    .catch((err) => {
      console.error('Error connecting to PostgreSQL database:', err);
    });

} catch (error) {
  console.error('Error creating PostgreSQL connection pool:', error);
  // Handle the error appropriately, e.g., log it, display an error message, or exit the application
  process.exit(1); // Terminate the application if the database connection is critical
}


export default pool;