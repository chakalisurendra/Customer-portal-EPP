const { DynamoDBClient, PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand, ScanCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const client = new DynamoDBClient();
const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");
const { validateAssignment } = require("../../validator/validateRequest");
const currentDate = Date.now();
const formattedDate = moment(currentDate).format("MM-DD-YYYY HH:mm:ss");

const updateAssignment = async (event) => {
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };

  try {
    const requestBody = JSON.parse(event.body);
    const { employeeId, assignmentId } = event.queryStringParameters;
    if (!assignmentId) {
      throw new Error("assignmentId is required");
    }
    if (!employeeId) {
      throw new Error("employeeId is required");
    }
    const validationResponse = validateAssignment(requestBody);
    console.log(`valdation : ${validationResponse.validation} message: ${validationResponse.validationMessage} `);

    if (!validationResponse.validation) {
      console.log(validationResponse.validationMessage);
      response.statusCode = 400;
      response.body = JSON.stringify({
        ErrorMessage: validationResponse.validationMessage,
      });
      return response;
    }

    // let updateExpression = "SET updatedDateTime = :updatedDateTime";
    // const expressionAttributeValues = {
    //   ":updatedDateTime": formattedDate,
    // };

    if (requestBody.branchOffice === "San Antonio, USA") {
      requestBody.onsite = "Yes";
    } else if (requestBody.branchOffice === "Bangalore, INDIA") {
      requestBody.onsite = "No";
    }

    if (!requestBody.assignedProject || requestBody.assignedProject.trim() === "") {
      requestBody.billableResource = "No";
    } else {
      requestBody.billableResource = "Yes";
    }

    const params = {
      TableName: process.env.ASSIGNMENTS_TABLE,
      Key: { assignmentId: { N: assignmentId }, employeeId: { N: employeeId } },
      UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
      ExpressionAttributeNames: objKeys.reduce(
        (acc, key, index) => ({
          ...acc,
          [`#key${index}`]: key,
        }),
        {}
      ),
      ExpressionAttributeValues: marshall(
        objKeys.reduce(
          (acc, key, index) => ({
            ...acc,
            [`:value${index}`]: requestBody[key],
          }),
          {}
        )
      ),
      ":updatedDateTime": formattedDate,
    };

    const updateResult = await client.send(new UpdateItemCommand(params));
    // const allowedFields = ["branchOffice", "department", "designation", "coreTechnology", "framework", "reportingManager", "billableResource", "assignedProject", "onsite"];

    // allowedFields.forEach((field) => {
    //   if (requestBody[field] !== undefined) {
    //     updateExpression += `, ${field} = :${field}`;
    //     expressionAttributeValues[`:${field}`] = requestBody[field];
    //   }
    // });

    // const key = {
    //   assignmentId: { N: assignmentId },
    //   employeeId: { N: employeeId },
    // };
    //   console.log("assignment keys are matched: ", key);

    // const params = {
    //   TableName: process.env.ASSIGNMENTS_TABLE,
    //   Key: key,
    //   UpdateExpression: updateExpression,
    //   ExpressionAttributeValues: marshall(expressionAttributeValues),
    // };
    // console.log("assignment parameters: ", params);

    // await client.send(new UpdateItemCommand(params));
    console.log("assignment updated: ", params);

    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_UPDATED_ASSIGNMENT_DETAILS,
      data: {
        assignmentId: assignmentId,
        employeeId: employeeId,
      },
    });
  } catch (e) {
    console.error(e);
    response.statusCode = 400;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_UPDATE_ASSIGNMENT_DETAILS,
      errorMsg: e.message,
    });
  }
  return response;
};

const createAssignment = async (event) => {
  console.log("inside the Create employee assignment details");
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
  try {
    const requestBody = JSON.parse(event.body);
    console.log("Request Body:", requestBody);

    const requiredFields = ["employeeId", "department", "designation", "branchOffice", "coreTechnology", "billableResource"];
    if (!requiredFields.every((field) => requestBody[field])) {
      throw new Error("Required fields are missing.");
    }
    let onsite = "No";
    if (requestBody.branchOffice === "San Antonio, USA") {
      onsite = "Yes";
    }
    if (requestBody.branchOffice === null || !["San Antonio, USA", "Bangalore, INDIA"].includes(requestBody.branchOffice)) {
      throw new Error("Incorrect BranchOffice");
    }
    if (requestBody.billableResource === null || !["Yes", "No"].includes(requestBody.billableResource)) {
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
    if (requestBody.department === null || !["IT", "Non- IT", "Sales"].includes(requestBody.department)) {
      throw new Error("Incorrect Department!");
    }

    const highestSerialNumber = await getHighestSerialNumber();
    console.log("Highest Serial Number:", highestSerialNumber);

    const assignmentId = highestSerialNumber !== null ? parseInt(highestSerialNumber) + 1 : 1;
    async function getHighestSerialNumber() {
      const params = {
        TableName: process.env.ASSIGNMENTS_TABLE,
        ProjectionExpression: "assignmentId",
        Limit: 1,
        ScanIndexForward: false,
      };

      try {
        const result = await client.send(new ScanCommand(params));
        console.log("DynamoDB Result:", result);
        if (result.Items.length === 0) {
          return 0;
        } else {
          const assignmentIdObj = result.Items[0].assignmentId;
          console.log("Assignment ID from DynamoDB:", assignmentIdObj);
          const assignmentId = parseInt(assignmentIdObj.N);
          console.log("Parsed Assignment ID:", assignmentId);
          return assignmentId;
        }
      } catch (error) {
        console.error("Error retrieving highest serial number:", error);
        throw error;
      }
    }

    const existingAssignment = await getAssignmentByEmployeeId(requestBody.employeeId);
    if (existingAssignment) {
      throw new Error("An assignment already exists for this employee.");
    }

    async function getAssignmentByEmployeeId(employeeId) {
      const params = {
        TableName: process.env.ASSIGNMENTS_TABLE,
        FilterExpression: "employeeId = :employeeId",
        ExpressionAttributeValues: {
          ":employeeId": { N: employeeId },
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
        Key: { employeeId: { N: employeeId } },
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
      TableName: process.env.ASSIGNMENTS_TABLE,
      Item: marshall({
        assignmentId: assignmentId,
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

const getAssignmentByEmployeeId = async (event) => {
  console.log("Fetch assignment details by employee ID");
  const employeeId = event.pathParameters.employeeId;

  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
  try {
    const params = {
      TableName: process.env.ASSIGNMENTS_TABLE,
      FilterExpression: "employeeId = :employeeId",
      ExpressionAttributeValues: {
        ":employeeId": { N: employeeId },
      },
    };
    const command = new ScanCommand(params);
    const { Items } = await client.send(command);

    if (!Items || Items.length === 0) {
      console.log("Assignments details not found for the employee.");
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: httpStatusMessages.ASSIGNMENTS_NOT_FOUND_FOR_EMPLOYEE,
      });
    } else {
      console.log("Successfully retrieved assignments for the employee.");
      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_ASSIGNMENT_FOR_EMPLOYEE,
        data: Items.map((item) => unmarshall(item)),
      });
    }
  } catch (error) {
    console.error(error);
    response.statusCode = httpStatusCodes.INTERNAL_SERVER_ERROR;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_RETRIEVE_ASSIGNMENTS,
      error: error.message,
    });
  }
  return response;
};

module.exports = {
  createAssignment,
  updateAssignment,
  getAssignmentByEmployeeId,
};
