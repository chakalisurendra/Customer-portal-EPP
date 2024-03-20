const { DynamoDBClient, PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const client = new DynamoDBClient();

// const autoIncreamentId = async (tableName1, id) => {
//   const params = {
//     TableName: tableName1,
//     ProjectionExpression: id,
//     Limit: 1000,
//     ScanIndexForward: false,
//   };

//   try {
//     const result = await client.send(new ScanCommand(params));
//     console.log("DynamoDB Result:", id, " ", result.Items.length);
//     console.log("DynamoDB Result2 :", id, " ", Object.keys(result.Items[0]).length);

//     if (result.Items.length === 0) {
//       return 1;
//     } else {
//       let incrementIdObj;
//       let increamentId;
//       if ("employeeId" === id) {
//         const sortedItems = result.Items.sort((a, b) => {
//           return parseInt(b.employeeId.N) - parseInt(a.employeeId.N);
//         });
//         incrementIdObj = sortedItems.Items[0];
//         console.log("employeeId from DynamoDB:", incrementIdObj);
//         increamentId = parseInt(incrementIdObj.N);
//       } else if ("assignmentId" === id) {
//         const sortedItems = result.Items.sort((a, b) => {
//           return parseInt(b.assignmentId.N) - parseInt(a.assignmentId.N);
//         });
//         incrementIdObj = sortedItems.Items[0];
//         console.log("assignmentId from DynamoDB:", incrementIdObj);
//         increamentId = parseInt(incrementIdObj.N);
//       }
//       console.log("Parsed ID:", increamentId);
//       const nextSerialNumber = increamentId !== null ? parseInt(increamentId) + 1 : 1;
//       return nextSerialNumber;
//     }
//   } catch (error) {
//     console.error("Error retrieving highest serial number:", error);
//     throw error;
//   }
// };
const autoIncreamentId = async (tableName1, id) => {
  const params = {
    TableName: tableName1,
    ProjectionExpression: id,
    Limit: 1000,
    ScanIndexForward: false,
  };

  try {
    const result = await client.send(new ScanCommand(params));
    console.log("DynamoDB Result:", id, " ", result.Items.length);
    if (!result.Items || result.Items.length === 0) {
      return 1;
    } else {
      let incrementIdObj;
      let increamentId;

      if ("employeeId" === id) {
        const sortedItems = result.Items.filter((item) => item.employeeId && !isNaN(item.employeeId.N));
        if (sortedItems.length > 0) {
          sortedItems.sort((a, b) => parseInt(b.employeeId.N) - parseInt(a.employeeId.N));
          incrementIdObj = sortedItems[0];
          increamentId = parseInt(incrementIdObj.employeeId.N);
        } else {
          increamentId = 0;
        }
      } else  if ("assignmentId" === id) {
        const sortedItems = result.Items.filter((item) => item.assignmentId && !isNaN(item.assignmentId.N));
        if (sortedItems.length > 0) {
          sortedItems.sort((a, b) => parseInt(b.assignmentId.N) - parseInt(a.assignmentId.N));
          incrementIdObj = sortedItems[0];
          increamentId = parseInt(incrementIdObj.assignmentId.N);
        } else {
          increamentId = 0;
        }
      }

      // if ("employeeId" === id) {
      //   const sortedItems = result.Items.sort((a, b) => {
      //     return parseInt(b.employeeId.N) - parseInt(a.employeeId.N);
      //   });
      //   incrementIdObj = sortedItems[0];
      //   console.log("employeeId from DynamoDB 00:", incrementIdObj);
      //   console.log("employeeId from DynamoDB:", incrementIdObj.N);
      //   console.log("employeeId from DynamoDB 1212 :", parseInt(incrementIdObj.N));
      //   increamentId = parseInt(incrementIdObj.N);
      // } else if ("assignmentId" === id) {
      //   const sortedItems = result.Items.sort((a, b) => {
      //     return parseInt(b.assignmentId.N) - parseInt(a.assignmentId.N);
      //   });

      //   incrementIdObj = sortedItems[0];
      //   console.log("assignmentId from DynamoDB:", incrementIdObj);
      //   console.log("assignmentId from DynamoDB 00:", incrementIdObj.N);
      //   console.log("assignmentId from DynamoDB 1212 :", parseInt(incrementIdObj.N));
      //   increamentId = parseInt(incrementIdObj.N);
      // }
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
