const { log } = require("../utils/logger");
const AWS = require("aws-sdk");
const _ = require("lodash");
const { AppConfig } = require("../../environment/appConfig");
const docClient = new AWS.DynamoDB.DocumentClient(AppConfig.DBConfig);

async function getGetEmployeeDetailsById(empId, logEvent) {
  const activityName = "DynamoDB: getEmployeeDetails";

  try {
    const params = {
      TableName: AppConfig.employeeDetailsTable,
      KeyConditionExpression: "#emp_id = :val",
      ExpressionAttributeNames: {
        "#emp_id": "emp_id",
      },
      ExpressionAttributeValues: {
        ":val": String(empId),
      },
    };

    logInfo(logEvent, params, activityName);
    let data = await docClient.query(params).promise();
    return data.Items;
  } catch (error) {
    logErr(
      logEvent,
      "Error occurred while fetching employee details from db",
      activityName
    );
    logErr(logEvent, error, activityName);
    throw error;
  }
}

module.exports = {
  getRegisteredDevicesData,
};
