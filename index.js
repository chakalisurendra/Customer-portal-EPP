
const path = require("path");
require("dotenv").config({
  override: true,
  path: path.join(__dirname, "development.env"),
});
const { Pool, cliet } = require("pg");

const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  post: process.env.PORT,
});

(async () => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('select current_user');
    const currentUser = rows[0]['current_user'];
    console.log(currentUser);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
})();
