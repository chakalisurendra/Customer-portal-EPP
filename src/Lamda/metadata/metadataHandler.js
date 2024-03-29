const { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand, QueryCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const { validateMetadata, validateMetadataUpdata } = require("../../validator/validateRequest");
const { updateMetadataAllowedFields } = require("../../validator/validateFields");
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

    const validateNameAndTypeExists = await isNameAndTypeExists(requestBody.name, requestBody.type);
    if (validateNameAndTypeExists) {
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

const isNameAndTypeExists = async (name, type) => {
  console.log("inside isNameAndTypeExists");
  const params = {
    TableName: process.env.METADATA_TABLE,
    FilterExpression: "#attrName = :nameValue AND #attrType = :typeValue",
    ExpressionAttributeNames: {
      "#attrName": "name",
      "#attrType": "type",
    },
    ExpressionAttributeValues: {
      ":nameValue": { S: name },
      ":typeValue": { S: type },
    },
  };
  const command = new ScanCommand(params);
  const data = await client.send(command);
  return data.Items.length > 0;
};

const getAllMeatadatas = async () => {
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const { Items } = await client.send(new ScanCommand({ TableName: process.env.METADATA_TABLE })); // Getting table name from the servetless.yml and setting to the TableName

    if (Items.length === 0) {
      // If there is no employee details found
      response.statusCode = httpStatusCodes.NOT_FOUND; // Setting the status code to 404
      response.body = JSON.stringify({
        message: httpStatusMessages.METADATA_DETAILS_NOT_FOUND,
      }); // Setting error message
    } else {
      const sortedItems = Items.sort((a, b) => a.metadataId.N.localeCompare(b.metadataId.N));

      // Map
      const metadataList = sortedItems.map((item) => {
        const metadata = unmarshall(item);
        return metadata;
      });

      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_METADATA_DETAILS,
        data: metadataList,
      });
    }
  } catch (e) {
    console.error(e);
    response.body = JSON.stringify({
      statusCode: httpStatusCodes.INTERNAL_SERVER_ERROR,
      message: httpStatusMessages.FAILED_TO_RETRIEVE_METADATA_DETAILS,
      errorMsg: e.message,
    });
  }
  return response;
};

const getMetadataByTypeAndStatus = async (event) => {
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

    const { Items } = await client.send(new ScanCommand(params));

    const sortedItems = Items.sort((a, b) => parseInt(a.metadataId.N) - parseInt(b.metadataId.N));
    const metadataList = sortedItems.map((item) => {
      const metadata = unmarshall(item);
      return metadata;
    });

    console.log({ metadataList });
    if (!metadataList || !metadataList.length > 0) {
      console.log("Metadata details not found.");
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: httpStatusMessages.METADATA_NOT_FOUND,
      });
    } else {
      console.log("Successfully retrieved metadata details.");
      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_METADATA,
        data: metadataList,
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

const updateMetadata = async (event) => {
  console.log("Update metadata");
  const response = { statusCode: httpStatusCodes.SUCCESS };

  try {
    const requestBody = JSON.parse(event.body);
    console.log("Request Body:", requestBody);
    const currentDate = Date.now();
    const formattedDate = moment(currentDate).format("MM-DD-YYYY HH:mm:ss");

    const { metadataId } = event.queryStringParameters;
    const validateMetadataparams = {
      TableName: process.env.METADATA_TABLE,
      Key: {
        metadataId: { N: metadataId }, 
      },
    };
    const { Item } = await client.send(new GetItemCommand(validateMetadataparams));
    console.log({ Item });
    if (!Item) {
      console.log("Metadata details not found.");
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: httpStatusMessages.METADATA_NOT_FOUND,
      });
      return response;
    }

    requestBody.updatedDateTime = formattedDate;

    const objKeys = Object.keys(requestBody).filter((key) => updateMetadataAllowedFields.includes(key));
    console.log(`Employee with objKeys ${objKeys} `);
    const validationResponse = validateMetadataUpdata(requestBody);
    console.log(`valdation : ${validationResponse.validation} message: ${validationResponse.validationMessage} `);

    if (!validationResponse.validation) {
      console.log(validationResponse.validationMessage);
      response.statusCode = 400;
      response.body = JSON.stringify({
        message: validationResponse.validationMessage,
      });
      return response;
    }
    const validateNameAndTypeExists = await isNameAndTypeNotIdExists(metadataId, requestBody.name, requestBody.type);
    if (validateNameAndTypeExists) {
      console.log(`With Name: ${requestBody.name} And type: ${requestBody.type} already metadata exists.`);
      response.statusCode = 400;
      response.body = JSON.stringify({
        message: `With Name: ${requestBody.name} And type: ${requestBody.type} already metadata exists.`,
      });
      return response;
    }

    const expressionAttributeValues = {};
    objKeys.forEach((key, index) => {
      expressionAttributeValues[`:value${index}`] = { S: requestBody[key] };
    });

    const params = {
      TableName: process.env.METADATA_TABLE,
      Key: { metadataId: { N: metadataId } }, // Ensure metadataId is passed as a number
      UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
      ExpressionAttributeNames: objKeys.reduce(
        (acc, key, index) => ({
          ...acc,
          [`#key${index}`]: key,
        }),
        {}
      ),
      ExpressionAttributeValues: expressionAttributeValues,
    };

    const updateResult = await client.send(new UpdateItemCommand(params));
    console.log("Successfully updated metadata details.");
    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_UPDATED_EMPLOYEE_DETAILS,
      metadataId: metadataId,
    });
  } catch (e) {
    console.error(e);
    response.statusCode = 400;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_UPDATED_EMPLOYEE_DETAILS,
      errorMsg: e.message,
    });
  }
  return response;
};

// const updateMetadata = async (event) => {
//   console.log("Update metadata");
//   const response = { statusCode: httpStatusCodes.SUCCESS };

//   try {
//     const requestBody = JSON.parse(event.body);
//     console.log("Request Body:", requestBody);
//     const currentDate = Date.now();
//     const formattedDate = moment(currentDate).format("MM-DD-YYYY HH:mm:ss");

//     const { metadataId } = event.queryStringParameters;
//     const validateMetadataparams = {
//       TableName: process.env.METADATA_TABLE,
//       Key: {
//         metadataId: { N: metadataId },
//       },
//     };
//     const { Item } = await client.send(new GetItemCommand(validateMetadataparams));
//     console.log({ Item });
//     if (!Item) {
//       console.log("Metadata details not found.");
//       response.statusCode = httpStatusCodes.NOT_FOUND;
//       response.body = JSON.stringify({
//         message: httpStatusMessages.METADATA_NOT_FOUND,
//       });
//       return response;
//     }

//     requestBody.updatedDateTime = formattedDate;

//     const objKeys = Object.keys(requestBody).filter((key) => updateMetadataAllowedFields.includes(key));
//     console.log(`Employee with objKeys ${objKeys} `);
//     const validationResponse = validateMetadataUpdata(requestBody);
//     console.log(`valdation : ${validationResponse.validation} message: ${validationResponse.validationMessage} `);

//     if (!validationResponse.validation) {
//       console.log(validationResponse.validationMessage);
//       response.statusCode = 400;
//       response.body = JSON.stringify({
//         message: validationResponse.validationMessage,
//       });
//       return response;
//     }
//     const validateNameAndTypeExists = await isNameAndTypeNotIdExists(metadataId, requestBody.name, requestBody.type);
//     if (validateNameAndTypeExists) {
//       console.log(`With Name: ${requestBody.name} And type: ${requestBody.type} already metadata exists.`);
//       response.statusCode = 400;
//       response.body = JSON.stringify({
//         message: `With Name: ${requestBody.name} And type: ${requestBody.type} already metadata exists.`,
//       });
//       return response;
//     }

//     // const params = {
//     //   TableName: process.env.METADATA_TABLE,
//     //   Key: marshall({ metadataId }),
//     //   UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
//     //   ExpressionAttributeNames: objKeys.reduce(
//     //     (acc, key, index) => ({
//     //       ...acc,
//     //       [`#key${index}`]: key,
//     //     }),
//     //     {}
//     //   ),
//     //   ExpressionAttributeValues: marshall(
//     //     objKeys.reduce(
//     //       (acc, key, index) => ({
//     //         ...acc,
//     //         [`:value${index}`]: requestBody[key],
//     //       }),
//     //       {}
//     //     )
//     //   ),
//     //   ":updatedDateTime": requestBody.updatedDateTime,
//     // };

//     const params = {
//       TableName: process.env.METADATA_TABLE,
//       Key: {
//         metadataId: {
//           N: metadataId,
//         },
//       }, // Ensure metadataId is passed as a number
//       UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
//       ExpressionAttributeNames: objKeys.reduce(
//         (acc, key, index) => ({
//           ...acc,
//           [`#key${index}`]: key,
//         }),
//         {}
//       ),
//       ExpressionAttributeValues: objKeys.reduce(
//         (acc, key, index) => ({
//           ...acc,
//           [`:value${index}`]: requestBody[key],
//         }),
//         {
//           ":updatedDateTime": {
//             S: requestBody.updatedDateTime,
//           },
//         }
//       ),
//     };

//     const updateResult = await client.send(new UpdateItemCommand(params));
//     console.log("Successfully updated metadata details.");
//     response.body = JSON.stringify({
//       message: httpStatusMessages.SUCCESSFULLY_UPDATED_EMPLOYEE_DETAILS,
//       metadataId: metadataId,
//     });
//   } catch (e) {
//     console.error(e);
//     response.statusCode = 400;
//     response.body = JSON.stringify({
//       message: httpStatusMessages.FAILED_TO_UPDATED_EMPLOYEE_DETAILS,
//       errorMsg: e.message,
//     });
//   }
//   return response;
// };

const isNameAndTypeNotIdExists = async (metadataId, name, type) => {
  console.log("inside isNameAndTypeExists");
  let response;
  const params = {
    TableName: process.env.METADATA_TABLE,
    FilterExpression: "#attrName = :nameValue AND #attrType = :typeValue",
    ExpressionAttributeNames: {
      "#attrName": "name",
      "#attrType": "type",
    },
    ExpressionAttributeValues: {
      ":nameValue": { S: name },
      ":typeValue": { S: type },
    },
  };
  const command = new ScanCommand(params);
  const data = await client.send(command);

  if (data.Items && data.Items.length > 0) {
    // Check if metadataId matches
    const matchingItem = data.Items.find((item) => item.metadataId && item.metadataId.N === metadataId);

    if (matchingItem) {
      console.log(`Found metadataId ${metadataId} in data`);
      return false; // metadataId found, so return false
    } else {
      // metadataId not found, return true
      return true;
    }
  } else {
    return false;
  }

  // if (data.Item.metadataId.N === metadataId) {
  //   return (response = false);
  // }
  // return response;
};

module.exports = {
  createMetadata,
  getMetadata,
  getAllMeatadatas,
  getMetadataByTypeAndStatus,
  updateMetadata,
};
