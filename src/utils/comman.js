const { DynamoDBClient, PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const client = new DynamoDBClient();

const autoIncreamentId = async (event) => {
  const id = event.id;
  const params = {
    TableName: event.tableName,
    ProjectionExpression: id,
    Limit: 1,
    ScanIndexForward: false,
  };

  try {
    const result = await client.send(new ScanCommand(params));
    console.log("DynamoDB Result:", result);
    if (result.Items.length === 0) {
      return 0;
    } else {
      const incrementIdObj = result.Items[0].employeeId;
      console.log("ID from DynamoDB:", incrementIdObj);
      const increamentId = parseInt(incrementIdObj.N);
      console.log("Parsed ID:", increamentId);
      const nextSerialNumber = increamentId !== null ? parseInt(increamentId) + 1 : 1;
      return nextSerialNumber;
    }
  } catch (error) {
    console.error("Error retrieving highest serial number:", error);
    throw error;
  }
};

module.exports = {
  autoIncreamentId,
};
