const { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const { validateAssetDetails } = require("../../validator/validateRequest");
const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");

// Create a DynamoDB client instance
const client = new DynamoDBClient();

// Get the current date and time in the desired format
const formattedDate = moment().format("MM-DD-YYYY HH:mm:ss");

// Function to create an asset
const createAsset = async (event) => {
  console.log("Create asset details");
  const response = { statusCode: httpStatusCodes.SUCCESS };

  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);

    // Validate the asset details
    const validationResponse = validateAssetDetails(requestBody);
    console.log(`Validation: ${validationResponse.validation} Message: ${validationResponse.validationMessage}`);

    if (!validationResponse.validation) {
      console.log(validationResponse.validationMessage);
      response.statusCode = httpStatusCodes.BAD_REQUEST;
      response.body = JSON.stringify({
        message: validationResponse.validationMessage,
      });
      return response;
    }

    // Check if the employee ID exists
    const employeeIdExists = await isEmployeeIdExists(requestBody.employeeId);
    if (!employeeIdExists) {
      console.log("Employee details not found.");
      response.statusCode = httpStatusCodes.BAD_REQUEST;
      response.body = JSON.stringify({
        message: httpStatusMessages.EMPLOYEE_DETAILS_NOT_FOUND,
      });
      return response;
    }

    if (isNaN(requestBody.assetId)) {
      console.log("Invalid assetId:", requestBody.assetId);
      response.statusCode = httpStatusCodes.BAD_REQUEST;
      response.body = JSON.stringify({
        message: "Invalid assetId. Please provide a valid number for assetId.",
      });
      return response;
    }

    const assetIdExists = await isAssetIdExists(requestBody.assetId);
    if (assetIdExists) {
      console.log("Asset details already exists.");
      response.statusCode = httpStatusCodes.BAD_REQUEST;
      response.body = JSON.stringify({
        message: httpStatusMessages.ASSET_ALREADY_EXISTS,
      });
      return response;
    }

    // Check if the employee ID exists in the asset table
    const employeeIdExistsInAssets = await isEmployeeIdExistsInAssets(requestBody.employeeId);
    if (employeeIdExistsInAssets) {
      console.log("Employee ID already exists in assets.");
      response.statusCode = httpStatusCodes.BAD_REQUEST;
      response.body = JSON.stringify({
        message: httpStatusMessages.EMPLOYEE_ALREADY_EXISTS_IN_ASSETS,
      });
      return response;
    }

    // Construct the parameters for putting the item into the DynamoDB table
    const params = {
      TableName: process.env.ASSETS_TABLE,
      Item: marshall({
        assetId: requestBody.assetId,
        employeeId: requestBody.employeeId,
        assetsType: requestBody.assetsType,
        serialNumber: requestBody.serialNumber,
        status: requestBody.status,
        createdDateTime: formattedDate,
        updatedDateTime: formattedDate,
      }),
    };

    // Put the item into the DynamoDB table
    const createResult = await client.send(new PutItemCommand(params));
    console.log("Successfully created asset details.");

    // Set the response body
    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_CREATED_ASSET_DETAILS,
      assetId: requestBody.assetId,
    });
  } catch (error) {
    console.error("Error creating asset:", error);
    response.statusCode = httpStatusCodes.INTERNAL_SERVER_ERROR;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_CREATE_ASSET_DETAILS,
      errorMsg: error.message,
    });
  }

  return response;
};

// Function to check if the employee ID exists
const isEmployeeIdExists = async (employeeId) => {
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    Key: { employeeId: { S: employeeId } },
  };
  const { Item } = await client.send(new GetItemCommand(params));
  return !!Item;
};

// // Function to check if the employee ID exists in the asset table
// const isEmployeeIdExistsInAssets = async (employeeId) => {
//   const params = {
//     TableName: process.env.ASSETS_TABLE,
//     KeyConditionExpression: "employeeId = :id",
//     ExpressionAttributeValues: {
//       ":id": { S: employeeId },
//     },
//     ProjectionExpression: "employeeId", // You can project only the attributes you need
//     Limit: 1, // Limit the result to 1 item since you only need to check existence
//   };
//   const { Items } = await client.send(new QueryCommand(params));
//   return Items.length > 0;
// };

const isEmployeeIdExistsInAssets = async (employeeId) => {
  const params = {
    TableName: process.env.ASSETS_TABLE,
    FilterExpression: "employeeId = :eId",
    ExpressionAttributeValues: {
      ":eId": { S: employeeId },
    },
    ProjectionExpression: "employeeId",
  };

  const command = new ScanCommand(params);
  const data = await client.send(command);
  return data.Items.length > 0;
};
// Function to check if the employee ID exists
const isAssetIdExists = async (assetId) => {
  const params = {
    TableName: process.env.ASSETS_TABLE,
    Key: { assetId: { N: assetId.toString() } }, // Convert assetId to string
  };
  const { Item } = await client.send(new GetItemCommand(params));
  return !!Item;
};

// Export the createAsset function
module.exports = {
  createAsset,
};
