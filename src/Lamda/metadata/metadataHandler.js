const { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const { validateMetadata } = require("../../validator/validateRequest");
const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");
const client = new DynamoDBClient();
const formattedDate = moment().format("MM-DD-YYYY HH:mm:ss");

const createMetadata = async (event) => {
  console.log("Create metadata details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const requestBody = JSON.parse(event.body);

    const validationResponse = validateMetadata(requestBody);
    console.log(`Validation: ${validationResponse.validation} Message: ${validationResponse.validationMessage}`);
    if (!validationResponse.validation) {
      console.log(validationResponse.validationMessage);
      response.statusCode = httpStatusCodes.BAD_REQUEST;
      response.body = JSON.stringify({
        message: validationResponse.validationMessage,
      });
      return response;
    }

    const incrementparams = {
      TableName: process.env.METADATA_TABLE,
      ProjectionExpression: "metadataId",
    };
    let maxAssetId;
    client.scan(incrementparams, (err, data) => {
      if (err) {
        maxAssetId = 0;
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
      } else {
        // Extract the assetIds from the items and find the maximum
        const assetIds = data.Items.map((item) => item["assetId"]);
        maxAssetId = Math.max(...assetIds);
        console.log("Max Asset ID:", maxAssetId);
      }
    });
    const nextSerialNumber = maxAssetId + 1;
    // const highestSerialNumber = await getMaxNumberFromTable();
    // console.log("Highest Serial Number:", highestSerialNumber);

    // const nextSerialNumber = highestSerialNumber !== null ? parseInt(highestSerialNumber) + 1 : 1;

    // async function getMaxNumberFromTable() {
    //   const params = {
    //     TableName: process.env.METADATA_TABLE,
    //     KeyConditionExpression: "metadataId > :minNumber",
    //     ExpressionAttributeValues: {
    //       ":minNumber": 0, // Assuming the minimum value is 0, adjust accordingly if different
    //     },
    //     ScanIndexForward: false, // Retrieve items in descending order
    //     Limit: 1, // Limit the result to just one item
    //   };

    //   try {
    //     const result = await client.send(new QueryCommand(params));
    //     console.log("DynamoDB Result:", result);
    //     if (!result.Items || result.Items.length === 0) {
    //       return 0; // No items found
    //     } else {
    //       const maxNumberObj = result.Items[0].metadataId;
    //       console.log("Max Number from DynamoDB:", maxNumberObj);
    //       const maxNumber = parseInt(maxNumberObj);
    //       console.log("Parsed Max Number:", maxNumber);
    //       return maxNumber;
    //     }
    //   } catch (error) {
    //     console.error("Error retrieving max number from table:", error);
    //     throw error;
    //   }
    // }

    // const highestSerialNumber = await getHighestSerialNumber();
    // console.log("Highest Serial Number:", highestSerialNumber);

    // const nextSerialNumber = highestSerialNumber !== null ? parseInt(highestSerialNumber) + 1 : 1;

    // async function getHighestSerialNumber() {
    //   const params = {
    //     TableName: process.env.METADATA_TABLE,
    //     KeyConditionExpression: "#metadataId > :startId",
    //     ExpressionAttributeNames: {
    //       "#metadataId": "metadataId",
    //     },
    //     ExpressionAttributeValues: {
    //       ":startId": 0, // Assuming metadataId starts from 0
    //     },
    //     ScanIndexForward: false,
    //     Limit: 1,
    //   };

    //   try {
    //     const result = await client.send(new QueryCommand(params));
    //     console.log("DynamoDB Result:", result);
    //     if (result.Items.length === 0) {
    //       return null; // No items found
    //     } else {
    //       const metadataIdObj = result.Items[0].metadataId;
    //       console.log("Metadata ID from DynamoDB:", metadataIdObj);
    //       const metadataId = parseInt(metadataIdObj);
    //       console.log("Parsed Metadata ID:", metadataId);
    //       return metadataId;
    //     }
    //   } catch (error) {
    //     console.error("Error retrieving highest serial number:", error);
    //     throw error;
    //   }
    // }

    // const highestSerialNumber = await getHighestSerialNumber();
    // console.log("Highest Serial Number:", highestSerialNumber);

    // const nextSerialNumber = highestSerialNumber !== null ? parseInt(highestSerialNumber) + 1 : 1;
    // async function getHighestSerialNumber() {
    //   const params = {
    //     TableName: process.env.METADATA_TABLE,
    //     ProjectionExpression: "metadataId",
    //     Limit: 1,
    //     ScanIndexForward: false,
    //   };

    //   try {
    //     const result = await client.send(new ScanCommand(params));
    //     console.log("DynamoDB Result:", result);
    //     if (result.Items.length === 0) {
    //       return 0;
    //     } else {
    //       const metadataIdObj = result.Items[0].metadataId;
    //       console.log("Metadata ID from DynamoDB:", metadataIdObj);
    //       const metadataId = parseInt(metadataIdObj.N);
    //       console.log("Parsed Metadata ID:", metadataId);
    //       return metadataId;
    //     }
    //   } catch (error) {
    //     console.error("Error retrieving highest serial number:", error);
    //     throw error;
    //   }
    // }
    // Construct the parameters for putting the item into the metadata table
    const params = {
      TableName: process.env.METADATA_TABLE,
      Item: marshall({
        metadataId: nextSerialNumber,
        name: requestBody.name,
        type: requestBody.type,
        status: requestBody.status,
        createdDateTime: formattedDate,
        updatedDateTime: null,
      }),
    };

    const createResult = await client.send(new PutItemCommand(params));
    console.log("Successfully created metadata details.");

    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_CREATED_METADATA,
      metadataId: nextSerialNumber,
    });
  } catch (error) {
    console.error("Error creating metadata:", error);
    response.statusCode = httpStatusCodes.INTERNAL_SERVER_ERROR;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_CREATE_METADATA,
      errorMsg: error.message,
    });
  }
  return response;
};

const getMetadata = async (event) => {
  console.log("Get metadata details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const metadataId = parseInt(event.pathParameters.metadataId); // Convert to number type
    const params = {
      TableName: process.env.METADATA_TABLE,
      Key: marshall({ metadataId }), // Assuming metadataId is the primary key
    };
    const { Item } = await client.send(new GetItemCommand(params));
    console.log({ Item });
    if (!Item) {
      console.log("Metadata details not found.");
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: httpStatusMessages.METADATA_NOT_FOUND,
      });
    } else {
      console.log("Successfully retrieved metadata details.");
      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_METADATA,
        data: unmarshall(Item),
      });
    }
  } catch (e) {
    console.error(e);
    response.statusCode = e.statusCode || httpStatusCodes.INTERNAL_SERVER_ERROR;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_RETRIEVE_METADATA,
      errorMsg: e.message,
    });
  }
  return response;
};

module.exports = {
  createMetadata,
  getMetadata,
};
