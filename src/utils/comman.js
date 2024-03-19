const { DynamoDBClient, PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const client = new DynamoDBClient();

const autoIncreamentId = async (tableName1, id) => {
  //const id = event.id;
  const params = {
    TableName: tableName1,
    ProjectionExpression: id,
    Limit: 1000,
    ScanIndexForward: false,
  };

  try {
    const result = await client.send(new ScanCommand(params));
    console.log("DynamoDB Result:", result);
    if (result.Items.length === 0) {
      return 1;
    } else {
      let incrementIdObj;
      if ("employeeId" === id) {
        incrementIdObj = unmarshall(result.Items[0].employeeId);
      } else if ("assignmentId" === id) {
        incrementIdObj = unmarshall(result.Items[0].assignmentId);
      }
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
