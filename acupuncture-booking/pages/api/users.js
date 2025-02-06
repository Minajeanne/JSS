import pool from '../../lib/db';

export default async function handler(req, res) {
  const [rows, fields] = await pool.query('SELECT * FROM users');
  res.status(200).json(rows);
}