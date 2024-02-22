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

    const nameAndTypeExists = await isNameAndTypeExists(requestBody.name, requestBody.type);
    console.log(`isNameAndTypeExists nameAndTypeExists : ${nameAndTypeExists}`);

    if (nameAndTypeExists) {
      console.log(`With Name: ${requestBody.name} And type: ${requestBody.type} already metadata exists.`);
      response.statusCode = 400;
      response.body = JSON.stringify({
        message: `With Name: ${requestBody.name} And type: ${requestBody.type} already metadata exists.`,
      });
      return response;
    }

    // Get max id
    const highestSerialNumber = await getHighestSerialNumber();
    console.log("Highest Serial Number:", highestSerialNumber);
    const nextSerialNumber = highestSerialNumber !== null ? parseInt(highestSerialNumber) + 1 : 1;
    async function getHighestSerialNumber() {
      const params = {
        TableName: process.env.METADATA_TABLE,
        ProjectionExpression: "metadataId",
        Limit: 1000,
      };

      try {
        const result = await client.send(new ScanCommand(params));
        const sortedItems = result.Items.sort((a, b) => {
          return parseInt(b.metadataId.N) - parseInt(a.metadataId.N);
        });

        console.log("Sorted Items:", sortedItems);
        if (sortedItems.length === 0) {
          return 0;
        } else {
          const highestmetadataId = parseInt(sortedItems[0].metadataId.N);
          console.log("Highest metadata ID:", highestmetadataId);
          return highestmetadataId;
        }
      } catch (error) {
        console.error("Error retrieving highest serial number:", error);
        throw error;
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
    const { metadataId } = event.queryStringParameters;

    const params = {
      TableName: process.env.METADATA_TABLE,
      Key: {
        metadataId: { N: metadataId },
      },
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

const getMetadataByStatusAndType = async (event) => {
  console.log("Get metadata with type and status");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const { type, status } = event.queryStringParameters;

    const params = {
      TableName: process.env.METADATA_TABLE,
      FilterExpression: "#type = :typeValue AND #status = :statusValue",
      ExpressionAttributeNames: {
        "#type": "type",
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":typeValue": { S: type },
        ":statusValue": { S: status },
      },
    };

    const data = await client.send(new ScanCommand(params));
    const items = data.Items.map((item) => unmarshall(item));

    console.log({ items });
    if (!items) {
      console.log("Metadata details not found.");
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: httpStatusMessages.METADATA_NOT_FOUND,
      });
    } else {
      console.log("Successfully retrieved metadata details.");
      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_METADATA,
        data: items,
      });
    }
  } catch (e) {
    console.error(e);
    response.body = JSON.stringify({
      statusCode: e.statusCode,
      message: httpStatusMessages.FAILED_TO_RETRIEVE_METADATA,
      errorMsg: e.message,
    });
  }
  return response;
};

const isNameAndTypeExists = async (name, type) => {
  console.log(`In side isNameAndTypeExists name : ${name} type: ${type} `);
  //let response = false;
  const params = {
    TableName: process.env.METADATA_TABLE,
    FilterExpression: "#type = :typeValue AND #name = :nameValue",
    ExpressionAttributeNames: {
      "#type": "type",
      "#name": "name",
    },
    ExpressionAttributeValues: {
      ":typeValue": { S: type },
      ":nameValue": { S: name },
    },
  };

  const data = await client.send(new ScanCommand(params));
  const items = data.Items.map((item) => unmarshall(item));
  console.log("length");
  console.log({ items });
  console.log("length wewr: ");

  console.log(items.length);

  if (items) {
    return true;
  } else {
    return false;
  }
};
module.exports = {
  createMetadata,
  getMetadata,
  getMetadataByStatusAndType,
};
