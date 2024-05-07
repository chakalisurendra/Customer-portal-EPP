const db = require('./db');

// Get all todos
async function getAllTodos() {
  const query = 'SELECT * FROM todos';
  const { rows } = await db.query(query);
  return rows;
}

// Get todo by ID
async function getTodoById(id) {
  const query = 'SELECT * FROM todos WHERE id = $1';
  const { rows } = await db.query(query, [id]);
  return rows[0];
}

// Create a new todo
async function createTodo(todo) {
  const { description, completed } = todo;
  const query = 'INSERT INTO todos (description, completed) VALUES ($1, $2) RETURNING *';
  const { rows } = await db.query(query, [description, completed]);
  return rows[0];
}

// Update todo by ID
async function updateTodo(id, updates) {
  const { description, completed } = updates;
  const query = 'UPDATE todos SET description = $1, completed = $2 WHERE id = $3 RETURNING *';
  const { rows } = await db.query(query, [description, completed, id]);
  return rows[0];
}

// Delete todo by ID
async function deleteTodo(id) {
  const query = 'DELETE FROM todos WHERE id = $1 RETURNING *';
  const { rows } = await db.query(query, [id]);
  return rows[0];
}

module.exports = {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
};
