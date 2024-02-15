const { DynamoDBClient, PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
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
      createResult,
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

// Function to check if the employee ID exists in the asset table
const isEmployeeIdExistsInAssets = async (employeeId) => {
  const params = {
    TableName: process.env.ASSETS_TABLE,
    Key: { employeeId: { S: employeeId } },
  };
  const { Item } = await client.send(new GetItemCommand(params));
  return !!Item;
};

// Export the createAsset function
module.exports = {
  createAsset,
};
