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

    const highestSerialNumber = await getHighestSerialNumber();
    console.log("Highest Serial Number:", highestSerialNumber);
    const nextSerialNumber = highestSerialNumber !== null ? parseInt(highestSerialNumber) + 1 : 1;
    async function getHighestSerialNumber() {
      const params = {
        TableName: process.env.METADATA_TABLE,
        ProjectionExpression: "metadataId",
        Limit: 1000, // Increase the limit to retrieve more items for sorting
      };

      try {
        const result = await client.send(new ScanCommand(params));

        // Sort the items in descending order based on assignmentId
        const sortedItems = result.Items.sort((a, b) => {
          return parseInt(b.metadataId.N) - parseInt(a.metadataId.N);
        });

        console.log("Sorted Items:", sortedItems); // Log the sorted items

        if (sortedItems.length === 0) {
          return 0; // If no records found, return null
        } else {
          const highestmetadataId = parseInt(sortedItems[0].metadataId.N);
          console.log("Highest Assignment ID:", highestmetadataId);
          return highestmetadataId;
        }
      } catch (error) {
        console.error("Error retrieving highest serial number:", error);
        throw error; // Propagate the error up the call stack
      }
    }

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

// const getMetadataIdAndStatus = async (event) => {
//   console.log("Get metadata details");
//   const response = { statusCode: httpStatusCodes.SUCCESS };
//   try {
//     const { type, status } = event.queryStringParameters;

//     const params = {
//       TableName: process.env.METADATA_TABLE,
//     };
//     // Construct the FilterExpression and ExpressionAttributeValues based on type and status
//     if (type && status) {
//       params.FilterExpression = "#type = :typeValue AND #status = :statusValue";
//       params.ExpressionAttributeNames = { "#type": "type", "#status": "status" };
//       params.ExpressionAttributeValues = { ":typeValue": type, ":statusValue": status };
//     } else if (type) {
//       params.FilterExpression = "#type = :typeValue";
//       params.ExpressionAttributeNames = { "#type": "type" };
//       params.ExpressionAttributeValues = { ":typeValue": type };
//     } else if (status) {
//       params.FilterExpression = "#status = :statusValue";
//       params.ExpressionAttributeNames = { "#status": "status" };
//       params.ExpressionAttributeValues = { ":statusValue": status };
//     }
//     const { Item } = await client.send(new GetItemCommand(params));
//     console.log({ Item });
//     if (!Item) {
//       console.log("Metadata details not found.");
//       response.statusCode = httpStatusCodes.NOT_FOUND;
//       response.body = JSON.stringify({
//         message: httpStatusMessages.METADATA_NOT_FOUND,
//       });
//     } else {
//       console.log("Successfully retrieved metadata details.");
//       response.body = JSON.stringify({
//         message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_METADATA,
//         data: unmarshall(Item),
//       });
//     }
//   } catch (e) {
//     console.error(e);
//     response.statusCode = e.statusCode || httpStatusCodes.INTERNAL_SERVER_ERROR;
//     response.body = JSON.stringify({
//       message: httpStatusMessages.FAILED_TO_RETRIEVE_METADATA,
//       errorMsg: e.message,
//     });
//   }
//   return response;
// };
const getMetadataByStatusAndType = async (event) => {
  try {
    // Extract query parameters from the event object
    const { type, status } = event.queryStringParameters;

    // Marshall the query parameters for DynamoDB query
    const marshalledParams = marshall({ type: type, status: status });

    // Construct DynamoDB query parameters based on the marshalled query parameters
    const params = {
      TableName: process.env.METADATA_TABLE,
      KeyConditionExpression: "#type = :typeValue AND #status = :statusValue",
      ExpressionAttributeNames: {
        "#type": "type",
        "#status": "status",
      },
      ExpressionAttributeValues: marshalledParams,
    };

    // Execute the DynamoDB query
    const data = await client.send(new QueryCommand(params));

    // Unmarshall the query results
    const items = data.Items.map((item) => unmarshall(item));

    // Construct a successful response with the query results
    const response = {
      statusCode: httpStatusCodes.OK,
      body: JSON.stringify(items),
    };

    return response;
  } catch (error) {
    // Handle any errors that occur during execution
    console.error("Error:", error);
    return {
      statusCode: httpStatusCodes.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: error.message,
      }),
    };
  }
};

module.exports = {
  createMetadata,
  getMetadata,
  getMetadataByStatusAndType,
};
