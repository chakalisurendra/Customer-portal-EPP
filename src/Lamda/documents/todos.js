require("dotenv").config();
const { Pool } = require("pg");

// Create a connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const getTodoById = async (event) => {
  console.log("getTodoById");

  try {
    await pool.connect(function (err, client, done) {
      if (err) throw new Error(err);
      const selectQuery = format("SELECT * FROM test");
      console.log("selectQuery: ", selectQuery);
      const testData = client.query(selectQuery, function (err, result) {
        if (err) throw new Error(err);
      });
      console.log("testdata: ", testData);
      return testData;
    });
    return null;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error; // Rethrow the error to propagate it to the caller
  }
};

// Get todo by ID
// const getTodoById = async (event) => {
//   const query = "SELECT * FROM todos";
//   console.log("pool" + pool);
//   console.log(process.env.DB_HOST);
//   console.log(process.env.DB_PORT);
//   console.log(process.env.DB_NAME);
//   console.log(process.env.DB_USER);
//   console.log(process.env.DB_PASSWORD);
//   const xz = await client.connect((err) => {
//     if (err) {
//       console.error("Error connecting to PostgreSQL database:", err);
//     } else {
//       console.log("Connected to PostgreSQL database successfully.");
//     }
//   });
//   console.log("query" + query);
//   const { rows } = await pool.query(query);
//   console.log("rows" + rows);

//   return rows;
// };

// const { Pool } = require("pg");

// const client = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
//   });

// Get all todos
const getAllTodos = async (event) => {
  const query = "SELECT * FROM todos";
  const { rows } = await client.query(query);
  return rows;
};

// // Get todo by ID
// const getTodoById = async (event) => {
//   console.log("SELECT * FROM todos WHERE id = $1");

//   const xz = await client.connect((err) => {
//   if (err) {
//     console.error("Error connecting to PostgreSQL database:", err);
//   } else {
//     console.log("Connected to PostgreSQL database successfully.");
//   }
// });
//   // const query = "SELECT * FROM todos WHERE id = $1";
//   // const { rows } = await client.query(query, [id]);
//   console.log("after connection:  " + xz);

//   return [];
// };

// // Create a new todo
const createTodo = async (event) => {
  const { name } = todo;
  const query = "INSERT INTO test (name) VALUES ($1) RETURNING *";
  const { rows } = await client.query(query, [name]);
  return rows[0];
};

// // Update todo by ID
// const updateTodo = async (event) => {
//   const { description, completed } = updates;
//   const query = "UPDATE todos SET description = $1, completed = $2 WHERE id = $3 RETURNING *";
//   const { rows } = await client.query(query, [description, completed, id]);
//   return rows[0];
// };

// // Delete todo by ID
// const deleteTodo = async (event) => {
//   const query = "DELETE FROM todos WHERE id = $1 RETURNING *";
//   const { rows } = await client.query(query, [id]);
//   return rows[0];
// };

module.exports = {
  getAllTodos,
  getTodoById,
  // createTodo,
  // updateTodo,
  // deleteTodo,
};
