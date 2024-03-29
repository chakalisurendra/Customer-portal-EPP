const { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand, ScanCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const { validateAssetDetails } = require("../../validator/validateRequest");
const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");
const client = new DynamoDBClient();
const formattedDate = moment().format("MM-DD-YYYY HH:mm:ss");

const createAsset = async (event) => {
  console.log("Create asset details");
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
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

    // Construct the parameters for putting the item into the asset table
    const params = {
      TableName: process.env.ASSETS_TABLE,
      Item: marshall({
        assetId: requestBody.assetId,
        assignTo: requestBody.assignTo || null,
        assetsType: requestBody.assetsType,
        serialNumber: requestBody.serialNumber,
        status: requestBody.status,
        createdDateTime: formattedDate,
        updatedDateTime: formattedDate,
      }),
    };

    if (requestBody.assignTo !== null && requestBody.assignTo !== undefined) {
      // Check if the employee ID exists in Employee Details
      const employeeIdExists = await isEmployeeIdExists(requestBody.assignTo);
      if (!employeeIdExists) {
        console.log("Employee details not found.");
        response.statusCode = httpStatusCodes.BAD_REQUEST;
        response.body = JSON.stringify({
          message: httpStatusMessages.EMPLOYEE_DETAILS_NOT_FOUND,
        });
        return response;
      }

      // Check if the employee ID exists in the asset table
      const employeeIdExistsInAssets = await isEmployeeIdExistsInAssets(requestBody.assignTo);
      if (employeeIdExistsInAssets) {
        console.log("Employee ID already exists in assets.");
        response.statusCode = httpStatusCodes.BAD_REQUEST;
        response.body = JSON.stringify({
          message: httpStatusMessages.EMPLOYEE_ALREADY_EXISTS_IN_ASSETS,
        });
        return response;
      }
    }
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
const isEmployeeIdExists = async (assignTo) => {
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    Key: { employeeId: { S: assignTo } },
  };
  const { Item } = await client.send(new GetItemCommand(params));
  return !!Item;
};

// Function to check if the employee ID exists in the asset table
const isEmployeeIdExistsInAssets = async (assignTo) => {
  const params = {
    TableName: process.env.ASSETS_TABLE,
    FilterExpression: "assignTo = :eId",
    ExpressionAttributeValues: {
      ":eId": { S: assignTo },
    },
    ProjectionExpression: "assignTo",
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
  console.log("inside the asset update  details");
  let response;
  const headers = {
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const requestBody = JSON.parse(event.body);
    const assetId = event.pathParameters.assetId;

    // Get asset details from DynamoDB based on assetId
    const getParams = {
      TableName: process.env.ASSETS_TABLE,
      Key: {
        assetId: { N: assetId },
      },
    };

    const getCommand = new GetItemCommand(getParams);
    const assetResult = await client.send(getCommand);

    // If asset not found
    if (!assetResult.Item) {
      response = {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          message: "Asset not found for the specified assetId",
        }),
      };
      return response;
    }

    const assignedTOExist = await isAssignedToExists(requestBody.assignTo, assetId);
    if (assignedTOExist) {
      throw new Error(`The specified 'assignTo' ${requestBody.assignTo} is already assigned with an asset ID `);
    }

    // Update the asset with the new values
    const updateParams = {
      TableName: process.env.ASSETS_TABLE,
      Key: {
        assetId: { N: assetId },
      },
      UpdateExpression: "SET assetsType = :assetsType, serialNumber = :serialNumber, assignTo = :assignTo, #st = :status, updatedDateTime = :updatedDateTime",
      ExpressionAttributeValues: marshall({
        ":assetsType": requestBody.assetsType,
        ":serialNumber": requestBody.serialNumber,
        ":status": requestBody.status,
        ":assignTo": requestBody.assignTo || null,
        ":updatedDateTime": formattedDate,
      }),
      ExpressionAttributeNames: {
        "#st": "status",
      },
      ReturnValues: "ALL_NEW",
    };

    const updateCommand = new UpdateItemCommand(updateParams);
    const updatedAsset = await client.send(updateCommand);
    console.log("Successfully updated asset.");

    response = {
      statusCode: httpStatusCodes.SUCCESS,
      headers,
      body: JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_UPDATED_ASSSET_DETAILS,
        updatedAsset: unmarshall(updatedAsset.Attributes),
      }),
    };
  } catch (error) {
    console.error("Error updating asset details:", error);
    response = {
      statusCode: httpStatusCodes.BAD_REQUEST,
      headers,
      body: JSON.stringify({
        message: httpStatusMessages.FAILED_TO_UPDATE_ASSSET_DETAILS,
        errorMsg: error.message,
        errorStack: error.stack,
      }),
    };
  }

  return response;
};

// Check if the email address already exists
const isAssignedToExists = async (employeeId, assetId) => {
  const params = {
    TableName: process.env.ASSETS_TABLE,
    FilterExpression: "assignTo = :assign AND assetId <> :assetId",
    ExpressionAttributeValues: {
      ":assign": { S: employeeId },
      ":assetId": { N: assetId.toString() }, // Convert assetId to string if needed
    },
    ProjectionExpression: "assignTo",
  };

  const command = new ScanCommand(params);
  const data = await client.send(command);
  return data.Items.length > 0;
};

const getAssetDetails = async (event) => {
  console.log("Get asset details");
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
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
    } else {
      const params = {
        TableName: process.env.ASSETS_TABLE,
        FilterExpression: "assignTo = :id",
        ExpressionAttributeValues: {
          ":id": { S: employeeId },
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
    }
  } catch (e) {
    console.error(e);
    response.body = JSON.stringify({
      statusCode: e.statusCode || httpStatusCodes.INTERNAL_SERVER_ERROR,
      message: httpStatusMessages.FAILED_TO_RETRIEVE_ASSET_INFORMATION,
      errorMsg: e.message,
    });
  }
  return response;
};

const getAllAssetDetails = async () => {
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const { Items } = await client.send(new ScanCommand({ TableName: process.env.ASSETS_TABLE }));
    if (Items.length === 0) {
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: httpStatusMessages.ASSET_INFORMATION_NOT_FOUND,
      });
    } else {
      const sortedItems = Items.sort((a, b) => parseInt(a.assetId.N) - parseInt(b.assetId.N));
      const assetList = sortedItems.map((item) => {
        const asset = unmarshall(item);
        return asset;
      });
      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_ASSET_INFORMATION,
        data: assetList,
      });
    }
  } catch (e) {
    console.error(e);
    response.body = JSON.stringify({
      statusCode: httpStatusCodes.INTERNAL_SERVER_ERROR,
      message: httpStatusMessages.FAILED_TO_RETRIEVE_ASSET_INFORMATION,
      errorMsg: e.message,
    });
  }
  return response;
};

const getAllAssetDetails1 = async (event) => {
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const { pageNo, pageSize, sortBy, sortOrder } = event.queryStringParameters;

    const params = {
      TableName: process.env.ASSETS_TABLE,
      Limit: pageSize,
      ExclusiveStartKey: undefined,
    };
    if (sortBy && sortOrder) {
      params.ExpressionAttributeNames = { "#sortKey": sortBy };
      params.ExpressionAttributeValues = { ":sortOrder": sortOrder };
      params.ScanIndexForward = sortOrder.toUpperCase() === "ASC";
      params.KeyConditionExpression = "#sortKey = :sortOrder";
    }
    const { Items, LastEvaluatedKey } = await client.send(new ScanCommand(params));

    if (Items.length === 0) {
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: httpStatusMessages.ASSET_INFORMATION_NOT_FOUND,
      });
    } else {
      const assetList = Items.map((item) => {
        const asset = unmarshall(item);
        return asset;
      });
      const responseBody = {
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_ASSET_INFORMATION,
        data: assetList,
      };
      if (LastEvaluatedKey) {
        responseBody.lastEvaluatedKey = LastEvaluatedKey;
      }
      response.body = JSON.stringify(responseBody);
    }
  } catch (e) {
    console.error(e);
    response.body = JSON.stringify({
      statusCode: httpStatusCodes.INTERNAL_SERVER_ERROR,
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
  getAllAssetDetails,
  getAllAssetDetails1,
};
