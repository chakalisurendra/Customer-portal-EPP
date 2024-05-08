const db = require("./db");
//const { getAllTodosHandler, getTodoByIdHandler, createTodoHandler, updateTodoHandler, deleteTodoHandler } = require("./todos");

// Get all todos
async function getAllTodos() {
  const query = "SELECT * FROM todos";
  const { rows } = await db.query(query);
  return rows;
}

// Get todo by ID
async function getTodoById(id) {
  const query = "SELECT * FROM todos WHERE id = $1";
  const { rows } = await db.query(query, [id]);
  return rows[0];
}

// Create a new todo
async function createTodo(todo) {
  const { description, completed } = todo;
  const query = "INSERT INTO todos (description, completed) VALUES ($1, $2) RETURNING *";
  const { rows } = await db.query(query, [description, completed]);
  return rows[0];
}

// Update todo by ID
async function updateTodo(id, updates) {
  const { description, completed } = updates;
  const query = "UPDATE todos SET description = $1, completed = $2 WHERE id = $3 RETURNING *";
  const { rows } = await db.query(query, [description, completed, id]);
  return rows[0];
}

// Delete todo by ID
async function deleteTodo(id) {
  const query = "DELETE FROM todos WHERE id = $1 RETURNING *";
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




// const { DynamoDBClient, PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand, ScanCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
// const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
// const moment = require("moment");
// const client = new DynamoDBClient();
// ////////////////////////////////////
// const { validateCreateDocument, validateUpdateDocumetDetails } = require("../../validator/validateRequest");
// const { updateDocumentAllowedFields } = require("../../validator/validateFields");
// /////////////////////////////////////////
// const { autoIncreamentId } = require("../../utils/comman");
// const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");
// const currentDate = Date.now();
// const formattedDate = moment(currentDate).format("YYYY-MM-DD HH:mm:ss");
// const BUCKET = "dev-empemployeedocuments";
// const parseMultipart = require("parse-multipart");
// const AWS = require("aws-sdk");
// const s3 = new AWS.S3();

// const createEmployeeDocument = async (event) => {
//   console.log("Inside the create employee document function");
//   const response = {
//     statusCode: httpStatusCodes.SUCCESS,
//     headers: {
//       "Access-Control-Allow-Origin": "*",
//     },
//   };
//   try {
//     const requestBody = JSON.parse(event.body);
//     const employeeId = requestBody.employeeId;
//     console.log("employee Id :", employeeId);

//     const newEmployeeId = await autoIncreamentId(process.env.DOCUMENT_TABLE, "documentId");

//     if (!validateCreateDocument(requestBody)) {
//       throw new Error("Required fields are missing.");
//     }

//     const params = {
//       TableName: process.env.DOCUMENT_TABLE,
//       FilterExpression: "employeeId = :employeeId",
//       ExpressionAttributeValues: {
//         ":employeeId": { S: employeeId },
//       },
//     };
//     const command = new ScanCommand(params);
//     const { Items } = await client.send(command);

//     if (Items && Items.length !== 0) {
//       throw new Error("Document already exists for this employee.");
//     } else {
//       console.log("Inside the employee document create function");
//       const params = {
//         TableName: process.env.DOCUMENT_TABLE,
//         Item: marshall({
//           documentId: newEmployeeId,
//           employeeId: requestBody.employeeId,
//           documentType: requestBody.documentType,
//           documentName: requestBody.documentName,
//           updateDate: requestBody.updateDate,
//           createdDateTime: formattedDate,
//         }),
//       };

//       const createResult = await client.send(new PutItemCommand(params));
//       console.log("Create result:", createResult);

//       response.body = JSON.stringify({
//         message: httpStatusMessages.SUCCESSFULLY_CREATED_EMPLOYEE_DOCUMENT,
//         documentId: newEmployeeId,
//       });
//     }
//   } catch (e) {
//     console.error(e);
//     response.statusCode = httpStatusCodes.BAD_REQUEST;
//     response.body = JSON.stringify({
//       message: httpStatusMessages.FAILED_TO_CREATE_EMPLOYEE_DOCUMENT,
//       errorMsg: e.message,
//       errorStack: e.stack,
//     });
//   }
//   return response;
// };

// const uploadEmployeeDocument = async (event) => {
//   console.log("Inside the upload document function");
//   try {
//     console.log("Inside the try block upload document function");
//     const documentId = event.pathParameters.documentId;
//     if (!documentId) {
//       throw new Error("document id is required");
//     }
//     console.log("document Id getting from req");
//     const { filename, data } = extractFile(event);
//     console.log("extract file function is executed");

//     const documentDetails = await getDocumentByEmployeeId(documentId);
//     console.log("document details", documentDetails);

//     if (!documentDetails) {
//       throw new Error("Document Details Not found for employee.");
//     }

//     const epochMilliseconds = Date.now();
//     // Upload file to S3
//     await s3
//       .putObject({
//         Bucket: BUCKET,
//         Key: filename,
//         Body: data,
//       })
//       .promise();

//     // Construct S3 object URL
//     console.log("Construct S3 object URL");
//     const s3ObjectUrl = `https://${BUCKET}.s3.amazonaws.com/${documentId}_${filename}_${epochMilliseconds}`;

//     // Update item in DynamoDB with S3 object URL
//     await client.send(
//       new UpdateItemCommand({
//         TableName: process.env.DOCUMENT_TABLE,
//         Key: {
//           documentId: { N: documentId.toString() },
//         },
//         UpdateExpression: "SET link = :link",
//         ExpressionAttributeValues: {
//           ":link": { S: s3ObjectUrl },
//         },
//         ReturnValues: "ALL_NEW",
//       })
//     );

//     return {
//       statusCode: 200,
//       body: JSON.stringify({
//         link: s3ObjectUrl,
//         message: "Document details of employee uploaded successfully",
//       }),
//     };
//   } catch (err) {
//     console.log("error-----", err);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ message: err.message }),
//     };
//   }
// };

// async function getDocumentByEmployeeId(documentId) {
//   const params = {
//     TableName: process.env.DOCUMENT_TABLE,
//     KeyConditionExpression: "documentId = :documentId",
//     ExpressionAttributeValues: {
//       ":documentId": { N: documentId.toString() },
//     },
//   };

//   try {
//     const result = await client.send(new QueryCommand(params));
//     if (result.Items.length > 0) {
//       return result.Items[0];
//     } else {
//       return null;
//     }
//   } catch (error) {
//     console.error("Error retrieving document details for employee:", error);
//     throw error;
//   }
// }

// function extractFile(event) {
//   console.log("inside the extract file");
//   const contentType = event.headers["Content-Type"];
//   if (!contentType) {
//     throw new Error("Content-Type header is missing in the request.");
//   }

//   const boundary = parseMultipart.getBoundary(contentType);
//   if (!boundary) {
//     throw new Error("Unable to determine the boundary from the Content-Type header.");
//   }
//   console.log("Unable to determine the boundary from the Content-Type header.");

//   const parts = parseMultipart.Parse(Buffer.from(event.body, "base64"), boundary);
//   console.log("parts exicuted");
//   if (!parts || parts.length === 0) {
//     throw new Error("No parts found in the multipart request.");
//   }
//   console.log("No parts found in the multipart request.");

//   const [{ filename, data, type }] = parts;

//   if (!filename || !data || !type) {
//     throw new Error("Invalid or missing file name or data in the multipart request.");
//   }
//   console.log("Invalid or missing file name or data in the multipart request.");

//   // Check file extension
//   const allowedExtensions = [".png", ".jpeg", ".pdf"];
//   const fileExtension = filename.substring(filename.lastIndexOf(".")).toLowerCase();
//   console.log("fileExtension", fileExtension);
//   if (!allowedExtensions.includes(fileExtension)) {
//     throw new Error("Invalid file extension. Only PNG, JPEG, and PDF files are allowed.");
//   }

//   // Check file size (assuming data is in binary format)
//   const fileSizeInMB = data.length / (1024 * 1024); // Convert bytes to MB
//   console.log("file size", fileSizeInMB);
//   const maxSizeInMB = 3;
//   if (fileSizeInMB > maxSizeInMB) {
//     throw new Error(`File size exceeds the maximum limit of ${maxSizeInMB} MB.`);
//   }

//   return {
//     filename,
//     data,
//   };
// }
// //////////////////////////////// /////////////////////////////////////
//     const updateEmployeeDocument = async (event) => {
//     console.log("update document details");
//     const response = {
//         statusCode: httpStatusCodes.SUCCESS,
//         headers: {
//         "Access-Control-Allow-Origin": "*",
//         },
//     };
//     try {
//         const requestBody = JSON.parse(event.body);
//         console.log("Request Body:", requestBody);
//         const { documentId, employeeId } = event.queryStringParameters;

//         const validateDocumentParams = {
//         TableName: process.env.DOCUMENT_TABLE,
//         Key: {
//             documentId: { N: documentId },
//         },
//         };
//         const { Item } = await client.send(new GetItemCommand(validateDocumentParams));
//         console.log({ Item });
//         if (!Item) {
//         console.log("Document details not found.");
//         response.statusCode = httpStatusCodes.NOT_FOUND;
//         response.body = JSON.stringify({
//             message: "Document details not found.",
//         });
//         return response;
//         }
//         const employeePermission = await employeePermissions(employeeId);

//         const objKeys = Object.keys(requestBody).filter((key) => updateDocumentAllowedFields.includes(key));
//         console.log(`Certification with objKeys ${objKeys} `);
//         const validationResponse = validateUpdateDocumetDetails(requestBody);
//         console.log(`valdation : ${validationResponse.validation} message: ${validationResponse.validationMessage} `);

//         if (!validationResponse.validation) {
//         console.log(validationResponse.validationMessage);
//         response.statusCode = 400;
//         response.body = JSON.stringify({
//             message: validationResponse.validationMessage,
//         });
//         return response;
//         }

//         const currentDate = Date.now();
//         const updateDate = moment(currentDate).format("MM-DD-YYYY HH:mm:ss");
//         const params = {
//         TableName: process.env.DOCUMENT_TABLE,
//         Key: { documentId: { N: documentId } },
//         UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}, #updatedDateTime = :updatedDateTime`,
//         ExpressionAttributeNames: {
//             ...objKeys.reduce(
//             (acc, key, index) => ({
//                 ...acc,
//                 [`#key${index}`]: key,
//             }),
//             {}
//             ),
//             "#updatedDateTime": "updatedDateTime",
//         },
//         ExpressionAttributeValues: marshall({
//             ...objKeys.reduce(
//             (acc, key, index) => ({
//                 ...acc,
//                 [`:value${index}`]: requestBody[key],
//             }),
//             {}
//             ),
//             ":updatedDateTime": updateDate,
//         }),
//         };
//         const updateResult = await client.send(new UpdateItemCommand(params));
//         console.log("Successfully updated Certification details.");
//         response.body = JSON.stringify({
//         message: httpStatusMessages.SUCCESSFULLY_UPDATED_DOCUMENTS_DETAILS,
//         documentId: documentId,
//         });
//     } catch (e) {
//         console.error(e);
//         response.statusCode = 400;
//         response.body = JSON.stringify({
//         message: httpStatusMessages.FAILED_TO_UPDATE_DOCUMENTS_DETAILS,
//         errorMsg: e.message,
//         });
//     }
//     return response;
//     };

//     const employeePermissions = async (employeeId) => {
//     console.log(`Inside employeePermissions`);
//     const response = {
//         statusCode: httpStatusCodes.SUCCESS,
//         headers: {
//         "Access-Control-Allow-Origin": "*",
//         },
//     };
//     const getItemParams = {
//         TableName: process.env.EMPLOYEE_TABLE,
//         Key: { employeeId: { N: employeeId } },
//     };
//     const { Item } = await client.send(new GetItemCommand(getItemParams));
//     if (!Item) {
//         console.log(`Employee with employeeId ${employeeId} not found`);
//         response.statusCode = 404;
//         response.body = JSON.stringify({
//         message: `Employee with employeeId ${employeeId} not found`,
//         });
//         return response;
//     }
//     const role = Item && Item.role && Item.role.S;
//     console.log(`role ${role} `);
//     if (role === "HR" || role === "Developer" || role === "Manager") {
//         console.log(`User have Permission`);
//     } else {
//         console.log(`User not have Permission`);
//         response.statusCode = 404;
//         response.body = JSON.stringify({
//         message: `User not have Permission`,
//         });
//         return response;
//     }
//     };


//     module.exports = {
//     createEmployeeDocument,
//     uploadEmployeeDocument,
//     updateEmployeeDocument,
//     };
