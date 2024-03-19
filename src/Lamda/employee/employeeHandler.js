const { DynamoDBClient, PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const client = new DynamoDBClient();
const { validateEmployeeDetails, validateUpdateEmployeeDetails } = require("../../validator/validateRequest");
const { updateEmployeeAllowedFields } = require("../../validator/validateFields");
const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");
const { autoIncreamentId, autoIncreamentId } = require("../../utils/comman");
const currentDate = Date.now(); // get the current date and time in milliseconds
const formattedDate = moment(currentDate).format("MM-DD-YYYY HH:mm:ss"); //formating date

const createEmployee = async (event) => {
  console.log("Create employee details");
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
  try {
    const requestBody = JSON.parse(event.body);

    if (!validateEmployeeDetails(requestBody)) {
      throw new Error("Required fields are missing.");
    }

    const employeeIdExists = await isEmployeeIdExists(requestBody.employeeId);
    if (employeeIdExists) {
      throw new Error("EmployeeId already exists.");
    }

    const emailExists = await isEmailExists(requestBody.officialEmailId);
    if (emailExists) {
      throw new Error("Email address already exists.");
    }

    const requestParams = {
      tableName: process.env.EMPLOYEE_TABLE,
      id: "employeeId",
    };
    let id = autoIncreamentId(requestParams);
    console.log("autoIncreamentId : ", id);
    const params = {
      TableName: process.env.EMPLOYEE_TABLE,
      Item: marshall({
        employeeId: id,
        firstName: requestBody.firstName,
        lastName: requestBody.lastName,
        dateOfBirth: requestBody.dateOfBirth,
        officialEmailId: requestBody.officialEmailId,
        password: requestBody.password || null,
        gender: requestBody.gender || null,
        ssnNumber: requestBody.ssnNumber || null,
        maritalStatus: requestBody.maritalStatus || null,
        nationality: requestBody.nationality || null,
        passportNumber: requestBody.passportNumber || null,
        mobileNumber: requestBody.mobileNumber || null,
        permanentAddress: requestBody.permanentAddress || null,
        contactPerson: requestBody.contactPerson || null,
        personalEmailAddress: requestBody.personalEmailAddress || null,
        presentAddress: requestBody.presentAddress || null,
        contactNumber: requestBody.contactNumber || null,
        joiningDate: requestBody.joiningDate || null,
        emergencyContactPerson: requestBody.emergencyContactPerson || null,
        panNumber: requestBody.panNumber || null,
        emergencyContactNumber: requestBody.emergencyContactNumber || null,
        resignedDate: requestBody.resignedDate || null,
        relievedDate: requestBody.relievedDate || null,
        leaveStructure: requestBody.leaveStructure || null,
        createdDateTime: formattedDate,
        updatedDateTime: requestBody.updatedDateTime || null,
        department: requestBody.department || null,
        aadhaarNumber: requestBody.aadhaarNumber || null,
        status: active,
      }),
    };
    const createResult = await client.send(new PutItemCommand(params));

    const requiredAssignmentFields = ["designation", "branchOffice"];
    if (!requiredAssignmentFields.every((field) => requestBody[field])) {
      throw new Error("Required Assignment Fields are missing.");
    }

    let onsite = "No";
    if (requestBody.branchOffice === "San Antonio, USA") {
      onsite = "Yes";
    }
    if (requestBody.branchOffice === null || !["San Antonio, USA", "Bangalore, INDIA"].includes(requestBody.branchOffice)) {
      throw new Error("Incorrect BranchOffice");
    }
    if (
      requestBody.designation === null ||
      ![
        "Software Engineer Trainee",
        "Software Engineer",
        "Senior Software Engineer",
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

    const highestSerialNumber1 = await getHighestSerialNumber();
    console.log("Highest Serial Number:", highestSerialNumber1);
    const nextSerialNumber1 = highestSerialNumber !== null ? parseInt(highestSerialNumber1) + 1 : 1;
    async function getHighestSerialNumber() {
      const params = {
        TableName: process.env.ASSIGNMENTS_TABLE,
        ProjectionExpression: "assignmentId",
        Limit: 100,
      };

      try {
        const result = await client.send(new ScanCommand(params));

        const sortedItems = result.Items.sort((a, b) => {
          return parseInt(b.assignmentId.N) - parseInt(a.assignmentId.N);
        });

        console.log("Sorted Items:", sortedItems);

        if (sortedItems.length === 0) {
          return 0;
        } else {
          const highestAssignmentId = parseInt(sortedItems[0].assignmentId.N);
          console.log("Highest Assignment ID:", highestAssignmentId);
          return highestAssignmentId;
        }
      } catch (error) {
        console.error("Error retrieving highest serial number:", error);
        throw error;
      }
    }

    const assignmentParams = {
      TableName: process.env.ASSIGNMENTS_TABLE,
      Item: marshall({
        assignmentId: nextSerialNumber1,
        employeeId: requestBody.employeeId,
        branchOffice: requestBody.branchOffice,
        designation: requestBody.designation,
        onsite: onsite,
        department: requestBody.department || null,
        framework: requestBody.framework || null,
        coreTechnology: requestBody.coreTechnology || null,
        reportingManager: requestBody.reportingManager || null,
        billableResource: requestBody.billableResource || null,
        createdDateTime: formattedDate,
      }),
    };

    params.Item.assignmentId = nextSerialNumber1;
    const createAssignmentResult = await client.send(new PutItemCommand(assignmentParams));
    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_CREATED_EMPLOYEE_DETAILS,
      employeeId: id,
      assignmentId: nextSerialNumber1,
    });
  } catch (e) {
    console.error(e);
    response.statusCode = httpStatusCodes.BAD_REQUEST;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_CREATE_EMPLOYEE_DETAILS,
      errorMsg: e.message,
      errorStack: e.stack,
    });
  }
  return response;
};

const updateEmployee = async (event) => {
  console.log("Update employee details");
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };

  try {
    const requestBody = JSON.parse(event.body);
    console.log("Request Body:", requestBody);
    const currentDate = Date.now();
    const formattedDate = moment(currentDate).format("MM-DD-YYYY HH:mm:ss");
    const employeeId = event.pathParameters ? event.pathParameters.employeeId : null;
    if (!employeeId) {
      console.log("Employee Id is required");
      throw new Error(httpStatusMessages.EMPLOYEE_ID_REQUIRED);
    }

    const getItemParams = {
      TableName: process.env.EMPLOYEE_TABLE,
      Key: marshall({ employeeId }),
    };
    const { Item } = await client.send(new GetItemCommand(getItemParams));
    if (!Item) {
      console.log(`Employee with employeeId ${employeeId} not found`);
      response.statusCode = 404;
      response.body = JSON.stringify({
        message: `Employee with employeeId ${employeeId} not found`,
      });
      return response;
    }

    requestBody.updatedDateTime = formattedDate;

    const objKeys = Object.keys(requestBody).filter((key) => updateEmployeeAllowedFields.includes(key));
    console.log(`Employee with objKeys ${objKeys} `);
    const validationResponse = validateUpdateEmployeeDetails(requestBody);
    console.log(`valdation : ${validationResponse.validation} message: ${validationResponse.validationMessage} `);

    if (!validationResponse.validation) {
      console.log(validationResponse.validationMessage);
      response.statusCode = 400;
      response.body = JSON.stringify({
        message: validationResponse.validationMessage,
      });
      return response;
    }

    const officialEmailIdExists = await isEmailNotEmployeeIdExists(requestBody.officialEmailId, employeeId);
    if (officialEmailIdExists) {
      console.log("officialEmailId already exists.");
      response.statusCode = 400;
      response.body = JSON.stringify({
        message: "officialEmailId already exists.",
      });
      return response;
    }

    const params = {
      TableName: process.env.EMPLOYEE_TABLE,
      Key: marshall({ employeeId }),
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
      ":updatedDateTime": requestBody.updatedDateTime,
    };

    const updateResult = await client.send(new UpdateItemCommand(params));
    console.log("Successfully updated Employee details.");
    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_UPDATED_EMPLOYEE_DETAILS,
      employeeId: employeeId,
    });
  } catch (e) {
    console.error(e);
    response.statusCode = 400;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_UPDATED_EMPLOYEE_DETAILS,
      employeeId: requestBody.employeeId, // If you want to include employeeId in the response
      errorMsg: e.message,
    });
  }
  return response;
};

const getEmployee = async (event) => {
  console.log("Get employee details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const params = {
      TableName: process.env.EMPLOYEE_TABLE,
      Key: marshall({ employeeId: event.pathParameters.employeeId }),
    };
    const { Item } = await client.send(new GetItemCommand(params));
    console.log({ Item });
    if (!Item) {
      console.log("Employee details not found.");
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: httpStatusMessages.EMPLOYEE_DETAILS_NOT_FOUND,
      });
    } else {
      console.log("Successfully retrieved Employee details.");

      // Fetch assignments for the current employee
      const employeeId = event.pathParameters.employeeId;
      const assignmentsParams = {
        TableName: process.env.ASSIGNMENTS_TABLE,
        FilterExpression: "employeeId = :employeeId",
        ExpressionAttributeValues: {
          ":employeeId": { S: employeeId },
        },
      };
      const assignmentsCommand = new ScanCommand(assignmentsParams);
      const { Items: assignmentItems } = await client.send(assignmentsCommand);

      const employeeData = unmarshall(Item);
      // Attach assignments to the employee object
      employeeData.assignments = assignmentItems.map(unmarshall);

      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_EMPLOYEE_DETAILS,
        data: employeeData,
      });
    }
  } catch (e) {
    console.error(e);
    response.body = JSON.stringify({
      statusCode: e.statusCode || httpStatusCodes.INTERNAL_SERVER_ERROR,
      message: httpStatusMessages.FAILED_TO_RETRIEVE_EMPLOYEE_DETAILS,
      errorMsg: e.message,
    });
  }
  return response;
};

const getAllEmployees = async () => {
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
  try {
    const { Items } = await client.send(new ScanCommand({ TableName: process.env.EMPLOYEE_TABLE })); // Getting table name from the serverless.yml and setting to the TableName

    if (Items.length === 0) {
      // If there are no employee details found
      response.statusCode = httpStatusCodes.NOT_FOUND; // Setting the status code to 404
      response.body = JSON.stringify({
        message: httpStatusMessages.EMPLOYEE_DETAILS_NOT_FOUND,
      }); // Setting error message
    } else {
      const sortedItems = Items.sort((a, b) => parseInt(a.employeeId.S) - parseInt(b.employeeId.S));

      // Map and set "password" field to null
      const employeesData = await Promise.all(
        sortedItems.map(async (item) => {
          const employee = unmarshall(item);
          if (employee.hasOwnProperty("password")) {
            employee.password = null;
          }

          // Fetch assignments for the current employee
          try {
            const employeeId1 = employee.employeeId; // Added missing 'const' keyword
            const params = {
              TableName: process.env.ASSIGNMENTS_TABLE,
              FilterExpression: "employeeId = :employeeId",
              ExpressionAttributeValues: {
                ":employeeId": { S: employeeId1 }, // Assuming employeeId is a string, adjust accordingly if not
              },
            };
            const command = new ScanCommand(params);
            const { Items } = await client.send(command); // Changed assignmentResult to Items

            // Attach assignments to the employee object
            employee.assignments = Items.map(unmarshall); // Changed assignmentResult to Items
          } catch (error) {
            console.error("Error fetching assignments:", error);
            throw error; // re-throwing the error to be caught by the outer catch block
          }

          return employee;
        })
      );

      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_EMPLOYEES_DETAILS,
        data: employeesData,
      });
    }
  } catch (e) {
    console.error(e);
    response.body = JSON.stringify({
      statusCode: httpStatusCodes.INTERNAL_SERVER_ERROR,
      message: httpStatusMessages.FAILED_TO_RETRIEVE_EMPLOYEE_DETAILS,
      errorMsg: e.message,
    });
  }
  return response;
};

// Function to check if employeeId already exists
const isEmployeeIdExists = async (employeeId) => {
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    Key: { employeeId: { S: employeeId } },
  };
  const { Item } = await client.send(new GetItemCommand(params));
  // If Item is not null, employeeId exists
  return !!Item;
};

const isEmailExists = async (emailAddress) => {
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    FilterExpression: "officialEmailId = :email",
    ExpressionAttributeValues: {
      ":email": { S: emailAddress },
    },
    ProjectionExpression: "officialEmailId",
  };

  const command = new ScanCommand(params);
  const data = await client.send(command);
  return data.Items.length > 0;
};

const isEmailNotEmployeeIdExists = async (emailAddress, employeeId) => {
  console.log("in side isEmailNotEmployeeIdExists");
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    FilterExpression: "officialEmailId = :email AND employeeId <> :id",
    ExpressionAttributeValues: {
      ":email": { S: emailAddress },
      ":id": { S: employeeId }, // Assuming employeeId is a string, adjust if needed
    },
    ProjectionExpression: "officialEmailId",
  };
  const command = new ScanCommand(params);
  const data = await client.send(command);
  return data.Items.length > 0;
};

async function getHighestSerialNumber() {
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    ProjectionExpression: "serialNumber",
    Limit: 100, // Increase the limit to retrieve more items for sorting
  };

  try {
    const result = await client.send(new ScanCommand(params));

    // Sort the items in descending order based on assignmentId
    const sortedItems = result.Items.sort((a, b) => {
      return parseInt(b.serialNumber.N) - parseInt(a.serialNumber.N);
    });

    console.log("Sorted Items:", sortedItems); // Log the sorted items

    if (sortedItems.length === 0) {
      return 0; // If no records found, return null
    } else {
      const highestSerialNumber = parseInt(sortedItems[0].serialNumber.N);
      console.log("Highest Assignment ID:", highestSerialNumber);
      return highestSerialNumber;
    }
  } catch (error) {
    console.error("Error retrieving highest serial number:", error);
    throw error; // Propagate the error up the call stack
  }
}

module.exports = {
  createEmployee,
  updateEmployee,
  getEmployee,
  getAllEmployees,
};
