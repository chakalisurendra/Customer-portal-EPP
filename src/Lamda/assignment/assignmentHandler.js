const {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  GetItemCommand,
  ScanCommand,
  QueryCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const client = new DynamoDBClient();
const {
  httpStatusCodes,
  httpStatusMessages,
} = require("../../environment/appconfig");
const currentDate = Date.now(); // get the current date and time in milliseconds
const formattedDate = moment(currentDate).format("YYYY-MM-DD HH:mm:ss"); // formatting date

const createAssignment = async (event) => {
  console.log("Create employee details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const requestBody = JSON.parse(event.body);
    console.log("Request Body:", requestBody);

    // Check for required fields
    const requiredFields = [
      "employeeId",
      "department",
      "designation",
      "branchOffice",
      "coreTechnology",
      "billableResource",
    ];
    if (!requiredFields.every((field) => requestBody[field])) {
      throw new Error("Required fields are missing.");
    }
    // Set onsite based on branchOffice
    let onsite = "No"; // Default value
    if (requestBody.branchOffice === "San Antonio(USA)") {
      onsite = "Yes";
    }
    if (
      requestBody.branchOffice === null ||
      !["San Antonio(USA)", "Bangalore(INDIA)"].includes(
        requestBody.branchOffice
      )
    ) {
      throw new Error("Incorrect BranchOffice");
    }
    if (
      requestBody.billableResource === null ||
      !["Yes", "No"].includes(requestBody.billableResource)
    ) {
      throw new Error("billableResource should be either 'Yes' or 'No'!");
    }

    if (
      requestBody.designation === null ||
      ![
        "Software Engineer Trainee",
        "Software Engineer",
        "Senior software Engineer",
        "Testing Engineer Trainee",
        "Testing Engineer",
        "Senior Testing Engineer",
        "Tech Lead",
        "Testing Lead",
        "Manager",
        "Project Manager",
        "Senior Manager",
        "Analyst",
        "Senior Analyst",
        "Architect",
        "Senior Architect",
        "Solution Architect",
        "Scrum Master",
        "Data Engineer",
      ].includes(requestBody.designation)
    ) {
      throw new Error("Incorrect Designation!");
    }
    if (
      requestBody.department === null ||
      !["IT", "Non- IT", "Sales"].includes(requestBody.department)
    ) {
      throw new Error("Incorrect Department!");
    }

    const highestSerialNumber = await getHighestSerialNumber();
    console.log("Highest Serial Number:", highestSerialNumber);

    const nextSerialNumber =
      highestSerialNumber !== null ? parseInt(highestSerialNumber) + 1 : 1;
    async function getHighestSerialNumber() {
      const params = {
        TableName: process.env.ASSIGNMENTS_TABLE,
        ProjectionExpression: "assignmentId",
        Limit: 1,
        ScanIndexForward: false, // Sort in descending order to get the highest serial number first
      };

      try {
        const result = await client.send(new ScanCommand(params));
        console.log("DynamoDB Result:", result); // Add this line to see the DynamoDB response
        if (result.Items.length === 0) {
          return 0; // If no records found, return null
        } else {
          // Parse and return the highest serial number without incrementing
          const assignmentIdObj = result.Items[0].assignmentId;
          console.log("Assignment ID from DynamoDB:", assignmentIdObj); // Add this line to see the retrieved assignmentId object
          const assignmentId = parseInt(assignmentIdObj.N); // Access the N property and parse as a number
          console.log("Parsed Assignment ID:", assignmentId); // Log the parsed assignmentId
          return assignmentId;
        }
      } catch (error) {
        console.error("Error retrieving highest serial number:", error);
        throw error; // Propagate the error up the call stack
      }
    }
    
    // Check if an assignment already exists for the employee
    const existingAssignment = await getAssignmentByEmployeeId(
      requestBody.employeeId
    );
    if (existingAssignment) {
      throw new Error("An assignment already exists for this employee.");
    }

    async function getAssignmentByEmployeeId(employeeId) {
      const params = {
        TableName: process.env.ASSIGNMENTS_TABLE,
        FilterExpression: "employeeId = :employeeId",
        ExpressionAttributeValues: {
          ":employeeId": { S: employeeId }, // Assuming employeeId is a string
        },
      };

      try {
        const result = await client.send(new ScanCommand(params));
        return result.Items.length > 0;
      } catch (error) {
        console.error("Error retrieving assignment by employeeId:", error);
        throw error;
      }
    }

    const checkEmployeeExistence = async (employeeId) => {
      const params = {
        TableName: process.env.EMPLOYEE_TABLE,
        Key: marshall({
          employeeId: employeeId,
        }),
      };

      try {
        const result = await client.send(new GetItemCommand(params));
        if (!result.Item) {
          throw new Error("Employee not found.");
        }
      } catch (error) {
        console.error("Error checking employee existence:", error);
        throw error;
      }
    };
    await checkEmployeeExistence(requestBody.employeeId);

    const params = {
      TableName: process.env.ASSIGNMENTS_TABLE, // Use ASSIGNMENTS_TABLE environment variable
      Item: marshall({
        assignmentId: nextSerialNumber,
        employeeId: requestBody.employeeId,
        department: requestBody.department,
        branchOffice: requestBody.branchOffice,
        framework: requestBody.framework,
        designation: requestBody.designation,
        coreTechnology: requestBody.coreTechnology,
        // designation: Array.isArray(requestBody.designation)
        // ? requestBody.designation.map(designation => ({ [designation]: true })) // Convert array of strings to array of objects
        // : [{ [requestBody.designation]: true }], // Convert string to array of object        coreTechnology: requestBody.coreTechnology || null,
        // framework: requestBody.framework || null,
        //reportingManager: typeof requestBody.reportingManager === 'string' ? requestBody.reportingManager : throw new error,
        reportingManager: requestBody.reportingManager,
        onsite: onsite,
        billableResource: requestBody.billableResource,
        createdDateTime: formattedDate,
      }),
    };

    const createResult = await client.send(new PutItemCommand(params));
    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_CREATED_ASSIGNMENT_DETAILS,
      createResult,
    });
  } catch (e) {
    console.error(e);
    response.statusCode = httpStatusCodes.BAD_REQUEST;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_CREATE_ASSIGNMENT_DETAILS,
      errorMsg: e.message,
      errorStack: e.stack,
    });
  }
  return response;
};

module.exports = {
  createAssignment,
};
