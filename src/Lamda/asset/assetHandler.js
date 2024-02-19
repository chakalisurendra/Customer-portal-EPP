const { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const { validateAssetDetails } = require("../../validator/validateRequest");
const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");
const client = new DynamoDBClient();
const formattedDate = moment().format("MM-DD-YYYY HH:mm:ss");

const createAsset = async (event) => {
  console.log("Create asset details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const requestBody = JSON.parse(event.body);

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

    // Check if the assetId is number
    if (isNaN(requestBody.assetId)) {
      console.log("Invalid assetId:", requestBody.assetId);
      response.statusCode = httpStatusCodes.BAD_REQUEST;
      response.body = JSON.stringify({
        message: "Invalid assetId. Please provide a valid number for assetId.",
      });
      return response;
    }

    // Check if the assetId is exists
    const assetIdExists = await isAssetIdExists(requestBody.assetId);
    if (assetIdExists) {
      console.log("Asset details already exists.");
      response.statusCode = httpStatusCodes.BAD_REQUEST;
      response.body = JSON.stringify({
        message: httpStatusMessages.ASSET_ALREADY_EXISTS,
      });
      return response;
    }

    if (requestBody.employeeId !== null) {
      // Check if the employee ID exists in Employee Details
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
    }

    // Construct the parameters for putting the item into the asset table
    const params = {
      TableName: process.env.ASSETS_TABLE,
      Item: marshall({
        assetId: requestBody.assetId,
        employeeId: requestBody.employeeId || null,
        assetsType: requestBody.assetsType,
        serialNumber: requestBody.serialNumber,
        status: requestBody.status,
        createdDateTime: formattedDate,
        updatedDateTime: formattedDate,
      }),
    };

    const createResult = await client.send(new PutItemCommand(params));
    console.log("Successfully created asset details.");

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

// Function to check if the employee ID exists in the asset table
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

// Function to check if the asset ID exists
const isAssetIdExists = async (assetId) => {
  const params = {
    TableName: process.env.ASSETS_TABLE,
    Key: { assetId: { N: assetId.toString() } },
  };
  const { Item } = await client.send(new GetItemCommand(params));
  return !!Item;
};

const updateAssetDetails = async (event) => {
  try {
    const requestBody = JSON.parse(event.body);
    const employeeId = event.pathParameters.employeeId;

    // Scan DynamoDB to find the asset details based on the employeeId
    const params = {
      TableName: process.env.ASSETS_TABLE,
      FilterExpression: "employeeId = :eId",
      ExpressionAttributeValues: {
        ":eId": { S: employeeId },
      },
      ProjectionExpression: "employeeId",
    };

    const command = new ScanCommand(params);
    const asset = await client.send(command);

    if (!asset) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "No assets found for the specified employeeId",
        }),
      };
    }

    // Update the asset with the new values
    const currentDateTime = moment().toISOString();
    const updateParams = {
      TableName: process.env.ASSETS_TABLE,
      Key: {
        assetId: asset.assetId,
      },
      UpdateExpression: "SET assetsType = :assetsType, serialNumber = :serialNumber, #st = :status, updatedDateTime = :updatedDateTime",
      ExpressionAttributeValues: {
        ":assetsType": requestBody.assetsType,
        ":serialNumber": requestBody.serialNumber,
        ":status": requestBody.status,
        ":updatedDateTime": currentDateTime,
      },
      ExpressionAttributeNames: {
        "#st": "status",
      },
      ReturnValues: "ALL_NEW",
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    const updatedAsset = await client.send(updateCommand);

    return {
      statusCode: httpStatusCodes.SUCCESS,
      body: JSON.stringify(updatedAsset.Attributes),
    };
  } catch (error) {
    console.error("Error updating asset details:", error);
    return {
      statusCode: httpStatusCodes.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({ message: "Failed to update asset details" }),
    };
  }
};

const getAssetDetails = async (event) => {
  console.log("Get asset details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const employeeId = event.pathParameters ? event.pathParameters.employeeId : null;
    if (!employeeId) {
      console.log("Employee Id is required");
      throw new Error(httpStatusMessages.EMPLOYEE_ID_REQUIRED);
    }

    const getEmployeeParams = {
      TableName: process.env.EMPLOYEE_TABLE,
      Key: marshall({ employeeId }),
    };
    const { Item } = await client.send(new GetItemCommand(getEmployeeParams));
    if (!Item) {
      console.log(`Employee with employeeId ${employeeId} not found`);
      response.statusCode = 404;
      response.body = JSON.stringify({
        message: `Employee with employeeId ${employeeId} not found`,
      });
    }

    const params = {
      TableName: process.env.ASSETS_TABLE,
      FilterExpression: "employeeId = :id",
      ExpressionAttributeValues: {
        ":id": employeeId,
      },
    };
    const { Items } = await client.send(new ScanCommand(params));
    console.log({ Items });
    if (!Items || Items.length === 0) {
      console.log("Asset information not found.");
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: httpStatusMessages.ASSET_INFORMATION_NOT_FOUND,
      });
    } else {
      console.log("Successfully retrieved Asset information.");
      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_ASSET_INFORMATION,
        data: Items.map((item) => unmarshall(item)),
      });
    }
  } catch (e) {
    console.error(e);
    response.body = JSON.stringify({
      statusCode: e.statusCode,
      message: httpStatusMessages.FAILED_TO_RETRIEVE_ASSET_INFORMATION,
      errorMsg: e.message,
    });
  }
  return response;
};
module.exports = {
  createAsset,
  updateAssetDetails,
  getAssetDetails,
};
