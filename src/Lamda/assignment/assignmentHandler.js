const { DynamoDBClient, PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand, ScanCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const client = new DynamoDBClient();
const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");
const { validateAssignment } = require("../../validator/validateRequest");
const { updateAssignmentAllowedFields } = require("../../validator/validateFields");
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
    console.log(`validation: ${validationResponse.validation} message: ${validationResponse.validationMessage}`);

    if (!validationResponse.validation) {
      console.log(validationResponse.validationMessage);
      response.statusCode = 400;
      response.body = JSON.stringify({
        ErrorMessage: validationResponse.validationMessage,
      });
      return response;
    }
    const currentDate = Date.now();
    const formattedDate = moment(currentDate).format("MM-DD-YYYY HH:mm:ss");
    const objKeys = Object.keys(requestBody).filter((key) => updateAssignmentAllowedFields.includes(key));
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
    const role = "manager";
    const managerExits = await isEmployeeExists(requestBody.managerId, role);
    if (!managerExits) {
      console.log("Manager is not found.");
      response.statusCode = 400;
      response.body = JSON.stringify({
        message: "Manager is not found.",
      });
      return response;
    }

    // const checkEmployeeExistence = async (managerId) => {
    //   console.log("Error checking employee existence:", error);
    //   const params = {
    //     TableName: process.env.EMPLOYEE_TABLE,
    //     Key: { employeeId: { N: managerId } },
    //   };

    //   try {
    //     const result = await client.send(new GetItemCommand(params));
    //     if (!result.Item) {
    //       console.log(`ManagerId ${managerId} not found`);
    //       response.statusCode = 404;
    //       response.body = JSON.stringify({
    //         message: `ManagerId ${managerId} not found`,
    //       });
    //       return response;
    //     }
    //   } catch (error) {
    //     console.log(`Failed to fetch ManagerId ${managerId}`);
    //     response.statusCode = 404;
    //     response.body = JSON.stringify({
    //       message: `Failed to fetch ManagerId ${managerId}`,
    //     });
    //     return response;
    //   }
    // };
    console.log("objKeys:", objKeys); // Add this line for debugging
    const params = {
      TableName: process.env.ASSIGNMENTS_TABLE,
      Key: { assignmentId: { N: assignmentId }, employeeId: { N: employeeId } },
      UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}, updatedDateTime = :updatedDateTime`,
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
          {
            ":updatedDateTime": formattedDate,
          }
        )
      ),
    };
    console.log("UpdateItem params:", params); // Add this line for debugging

    const updateResult = await client.send(new UpdateItemCommand(params));
    console.log("UpdateItem result:", updateResult); // Debugging: Check the result of the UpdateItem operation
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

    const requiredFields = ["employeeId", "department", "designation", "branchOffice", "coreTechnology", "billableResource", "managerId"];
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
        "HR Admin",
        "HR Generalist",
        "HR Associate",
        "Senior Manager",
        "Delivery Manager",
        "Project Manager",
        "Software Engineer Trainee",
        "Senior software Engineer",
        "Testing Engineer Trainee",
        "Testing Engineer",
        "Senior Testing Engineer",
        "Tech Lead",
        "Tech Lead",
        "Testing Lead",
        "Analyst",
        "Senior Analyst",
        "Architect",
        "Senior Architect",
        "Solution Architect",
        "Scrum Master",
        "Data Engineer",
        "Accountant",
        "Contractor",
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
        managerId: requestBody.managerId,
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
////////////////////////////////////////////////
// const isEmployeeIdExists = async (employeeId) => {
//   const params = {
//     TableName: process.env.EMPLOYEE_TABLE,
//     Key: { employeeId: { N: employeeId } },
//   };
//   const { Item } = await client.send(new GetItemCommand(params));
//   return !!Item;
// };
// const isEmployeeExists = async (managerId, role) => {
//   const params = {
//     TableName: process.env.EMPLOYEE_TABLE,
//     Key: {
//       employeeId: { N: managerId },
//       role: { S: role }, // Assuming role is a string, adjust if it's another type
//     },
//   };
//   const { Item } = await client.send(new GetItemCommand(params));
//   return !!Item;
// };

const isEmployeeExists = async (managerId, role) => {
  console.log("in side isEmployeeExists");
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    FilterExpression: "role = :role AND employeeId <> :id",
    ExpressionAttributeValues: {
      ":role": { S: role },
      ":id": { N: managerId },
    },
    ProjectionExpression: "role",
  };
  // const command = new ScanCommand(params);
  // const data = await client.send(command);
  const { Items } = await client.send(new ScanCommand(params));

  return Items.length > 0;
};

module.exports = {
  createAssignment,
  updateAssignment,
  getAssignmentByEmployeeId,
};
