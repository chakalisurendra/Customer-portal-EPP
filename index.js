const { getAllTodos, getTodoById, createTodo, updateTodo, deleteTodo } = require("./documents/documentHandler");
// const { updateDocumentAllowedFields } = require("../../validator/validateFields");
// Get all todos handler
async function getAllTodosHandler(event) {
  try {
    const todos = await getAllTodos();
    return {
      statusCode: 200,
      body: JSON.stringify(todos),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
}

// Get todo by ID handler
async function getTodoByIdHandler(event) {
  const { id } = event.pathParameters;
  try {
    const todo = await getTodoById(id);
    if (!todo) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Todo not found" }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(todo),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
}

// Create todo handler
async function createTodoHandler(event) {
  const todo = JSON.parse(event.body);
  try {
    const newTodo = await createTodo(todo);
    return {
      statusCode: 201,
      body: JSON.stringify(newTodo),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
}

// Update todo by ID handler
async function updateTodoHandler(event) {
  const { id } = event.pathParameters;
  const updates = JSON.parse(event.body);
  try {
    const updatedTodo = await updateTodo(id, updates);
    return {
      statusCode: 200,
      body: JSON.stringify(updatedTodo),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
}

// Delete todo by ID handler
async function deleteTodoHandler(event) {
  const { id } = event.pathParameters;
  try {
    const deletedTodo = await deleteTodo(id);
    return {
      statusCode: 200,
      body: JSON.stringify(deletedTodo),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
}

module.exports = {
  getAllTodosHandler,
  getTodoByIdHandler,
  createTodoHandler,
  updateTodoHandler,
  deleteTodoHandler,
};