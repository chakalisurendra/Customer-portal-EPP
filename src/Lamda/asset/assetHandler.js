const { DynamoDBClient, PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const client = new DynamoDBClient();
const { validateAssetDetails } = require("../../validator/validateRequest");
const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");
const currentDate = Date.now(); // get the current date and time in milliseconds
const formattedDate = moment(currentDate).format("MM-DD-YYYY HH:mm:ss"); // formatting date

async function getMaxIdUsingScan(tableName) {
  try {
    const params = {
      TableName: tableName,
      ProjectionExpression: "id", // Assuming 'id' is the attribute name for the ID
    };
    const { Items } = await client.send(new ScanCommand(params));
    if (Items && Items.length > 0) {
      // Find the maximum ID among the items
      let maxId = 0;
      for (const item of Items) {
        const id = parseInt(item.id.N); // Assuming 'id' attribute is of type Number
        if (id > maxId) {
          maxId = id;
        }
      }
      return maxId;
    } else {
      return 0; // If no items found, return 0
    }
  } catch (error) {
    console.error("Error getting max ID:", error);
    throw error;
  }
}
const createAsset = async (event) => {
  console.log("Create asset details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const requestBody = JSON.parse(event.body);

    const validationResponse = validateAssetDetails(requestBody);
    console.log(`validation: ${validationResponse.validation} message: ${validationResponse.validationMessage}`);

    if (!validationResponse.validation) {
      console.log(validationResponse.validationMessage);
      response.statusCode = 400;
      response.body = JSON.stringify({
        message: validationResponse.validationMessage,
      });
      return response;
    }

    const employeeIdExists = await isEmployeeIdExists(requestBody.employeeId);
    if (employeeIdExists) {
      console.log("EmployeeId already exists.");
      response.statusCode = 400;
      response.body = JSON.stringify({
        message: httpStatusMessages.EMPLOYEE_ALREADY_EXISTS,
      });
      return response;
    }

    // Generate auto-incremented assetId
    let assetMaxId = await getMaxIdUsingScan();
    const assetId = assetMaxId + 1;
    const params = {
      TableName: process.env.ASSETS_TABLE,
      Item: marshall({
        employeeId: requestBody.employeeId,
        assetId: assetId,
        assetsType: requestBody.assetsType,
        serialNumber: requestBody.serialNumber,
        status: requestBody.status,
        createdDateTime: formattedDate,
        updatedDateTime: formattedDate,
      }),
    };
    const createResult = await client.send(new PutItemCommand(params));
    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_CREATED_ASSET_DETAILS,
      createResult,
    });
  } catch (e) {
    console.error(e);
    response.statusCode = httpStatusCodes.BAD_REQUEST;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_CREATE_ASSET_DETAILS,
      errorMsg: e.message,
      errorStack: e.stack,
    });
  }
  return response;
};

const isEmployeeIdExists = async (employeeId) => {
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    Key: { employeeId: { S: employeeId } },
  };
  const { Item } = await client.send(new GetItemCommand(params));
  return !!Item;
};
