const { DynamoDBClient, PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const client = new DynamoDBClient();
const { validateEmployeeDetails, validateUpdateEmployeeDetails } = require("../../validator/validateRequest");
const { autoIncreamentId, pagination } = require("../../utils/comman");
const { updateEmployeeAllowedFields } = require("../../validator/validateFields");
const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");
const currentDate = Date.now();
const formattedDate = moment(currentDate).format("MM-DD-YYYY HH:mm:ss");

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

    const validationResponse = validateEmployeeDetails(requestBody);
    console.log(`valdation : ${validationResponse.validation} message: ${validationResponse.validationMessage} `);

    if (!validationResponse.validation) {
      console.log(validationResponse.validationMessage);
      response.statusCode = 400;
      response.body = JSON.stringify({
        ErrorMessage: validationResponse.validationMessage,
      });
      return response;
    }

    const emailExists = await isEmailExists(requestBody.officialEmailId);
    if (emailExists) {
      console.log("Email address already exists.");
      throw new Error("Email address already exists.");
    }
    const newEmployeeId = await autoIncreamentId(process.env.EMPLOYEE_TABLE, "employeeId");
    console.log("new employee id : ", newEmployeeId);
    const params = {
      TableName: process.env.EMPLOYEE_TABLE,
      Item: marshall({
        employeeId: newEmployeeId,
        firstName: requestBody.firstName,
        lastName: requestBody.lastName,
        name: `${requestBody.firstName} ${requestBody.lastName}`,
        dateOfBirth: requestBody.dateOfBirth,
        officialEmailId: requestBody.officialEmailId,
        designation: requestBody.designation || null,
        branchOffice: requestBody.branchOffice || null,
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
        department: requestBody.department || null,
        aadhaarNumber: requestBody.aadhaarNumber || null,
        role: requestBody.role || null,
        status: "active",
        isAbsconded: "No",
        createdDateTime: formattedDate,
        updatedDateTime: null,
      }),
    };
    const createResult = await client.send(new PutItemCommand(params));
    let onsite = "No";
    if (requestBody.branchOffice === "San Antonio, USA") {
      onsite = "Yes";
    }
    const newAssignmentId = await autoIncreamentId(process.env.ASSIGNMENTS_TABLE, "assignmentId");
    const assignmentParams = {
      TableName: process.env.ASSIGNMENTS_TABLE,
      Item: marshall({
        assignmentId: newAssignmentId,
        employeeId: newEmployeeId,
        branchOffice: requestBody.branchOffice || null,
        role: requestBody.role || null,
        designation: requestBody.designation || null,
        onsite: onsite,
        department: requestBody.department || null,
        framework: requestBody.framework || null,
        coreTechnology: requestBody.coreTechnology || null,
        managerId: requestBody.managerId || null,
        reportingManager: requestBody.reportingManager || null,
        billableResource: requestBody.billableResource || null,
        createdDateTime: formattedDate,
        updatedDateTime: null,
      }),
    };
    const createAssignmentResult = await client.send(new PutItemCommand(assignmentParams));
    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_CREATED_EMPLOYEE_DETAILS,
      data: {
        employeeId: newEmployeeId,
        assignmentId: newAssignmentId,
      },
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
    //const { employeeId } = event.queryStringParameters;
    const employeeId = event.queryStringParameters && event.queryStringParameters.employeeId;

    if (!employeeId) {
      console.log("Employee Id is required");
      throw new Error(httpStatusMessages.EMPLOYEE_ID_REQUIRED);
    }

    const getItemParams = {
      TableName: process.env.EMPLOYEE_TABLE,
      Key: { employeeId: { N: employeeId } },
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

    if (!requestBody.managerId) {
      const managerExists = await checkEmployeeExistence(requestBody.managerId);
      if (!managerExists) {
        console.log("Email address already exists.");
        throw new Error("Email address already exists.");
      }
    }

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

    if (requestBody.isAbsconded === "Yes") {
      requestBody.status = "inactive";
    }

    const currentDate = Date.now();
    const updateDate = moment(currentDate).format("MM-DD-YYYY HH:mm:ss");
    const params = {
      TableName: process.env.EMPLOYEE_TABLE,
      Key: { employeeId: { N: employeeId } },
      UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}, #updatedDateTime = :updatedDateTime`,
      ExpressionAttributeNames: {
        ...objKeys.reduce(
          (acc, key, index) => ({
            ...acc,
            [`#key${index}`]: key,
          }),
          {}
        ),
        "#updatedDateTime": "updatedDateTime",
      },
      ExpressionAttributeValues: marshall({
        ...objKeys.reduce(
          (acc, key, index) => ({
            ...acc,
            [`:value${index}`]: requestBody[key],
          }),
          {}
        ),
        ":updatedDateTime": updateDate,
      }),
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
      errorMsg: e.message,
    });
  }
  return response;
};

const getEmployee = async (event) => {
  console.log("Get employee details");
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
  try {
    const { employeeId } = event.queryStringParameters;

    const params = {
      TableName: process.env.EMPLOYEE_TABLE,
      Key: { employeeId: { N: employeeId } },
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
      const assignmentsParams = {
        TableName: process.env.ASSIGNMENTS_TABLE,
        FilterExpression: "employeeId = :employeeId",
        ExpressionAttributeValues: {
          ":employeeId": { N: employeeId },
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

const getAllEmployees = async (event) => {
  console.log("Get all employees");
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
  const { pageNo, pageSize, searchText } = event.queryStringParameters;
  let designationFilter = [];
  let branchFilter = [];

  if (event.multiValueQueryStringParameters && event.multiValueQueryStringParameters.designation) {
    designationFilter = event.multiValueQueryStringParameters.designation.flatMap((designation) => designation.split(",")); // Split by commas if exists
  }
  if (event.multiValueQueryStringParameters && event.multiValueQueryStringParameters.branchOffice) {
    branchFilter = event.multiValueQueryStringParameters.branchOffice.flatMap((branchOffice) => branchOffice.split(",")); // Split by commas if exists
  }

  try {
    const params = {
      TableName: process.env.EMPLOYEE_TABLE,
    };
    const { Items } = await client.send(new ScanCommand(params));

    let filteredItems = Items;

    // Apply search criteria if provided
    if (searchText) {
      console.log("Applying search criteria:", searchText);
      filteredItems = applySearchCriteria(Items, searchText);
      if (filteredItems.length === 0) {
        throw new Error("No employees found matching the search criteria.");
      }
    }

    // Apply filters if provided
    if (designationFilter.length > 0 || branchFilter.length > 0) {
      console.log("Filtering started with designationFilter:", designationFilter, "and branchFilter:", branchFilter);
      filteredItems = applyFilters(filteredItems, designationFilter, branchFilter);
      if (filteredItems.length === 0) {
        throw new Error("No employees found matching the filter criteria.");
      }
      console.log("Filtered items:", filteredItems);
    }

    // Apply pagination
    const paginatedData = pagination(
      filteredItems.map((item) => unmarshall(item)),
      pageNo,
      pageSize
    );

    if (!paginatedData.items || paginatedData.items.length === 0) {
      console.log("No employees found after filtering.");
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: httpStatusMessages.EMPLOYEES_DETAILS_NOT_FOUND,
      });
    } else {
      console.log("Successfully retrieved filtered and paginated employees.");
      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_EMPLOYEES_DETAILS,
        data: paginatedData,
      });
    }
  } catch (e) {
    console.error(e);
    response.body = JSON.stringify({
      statusCode: e.statusCode,
      message: httpStatusMessages.FAILED_TO_RETRIEVE_EMPLOYEE_DETAILS,
      errorMsg: e.message,
    });
  }
  return response;
};

const applySearchCriteria = (employeesData, searchText) => {
  console.log("Applying search criteria:", searchText);
  return employeesData.filter((employee) => matchesSearchText(employee, searchText));
};

const applyFilters = (employeesData, designationFilter, branchFilter) => {
  console.log("Applying filters...");
  return employeesData.filter((employee) => {
    // Check if employee.branch exists before accessing its properties
    if (!employee.branchOffice || !employee.branchOffice.S || !employee.designation || !employee.designation.S) {
      // If employee data is incomplete, skip filtering for this employee
      return false;
    }
    console.log("Employee:", employee);
    const passesDesignationFilter = designationFilter.length === 0 || (employee.designation && designationFilter.includes(employee.designation.S));
    // Note: Use `.S` to access the string value of DynamoDB attributes
    const passesBranchFilter = branchFilter.length === 0 || matchesBranch(employee.branchOffice.S, branchFilter);
    const passesFilters = passesDesignationFilter && passesBranchFilter;
    return passesFilters;
  });
};

const matchesSearchText = (employee, searchText) => {
  // Check if search text meets the minimum character requirement for name search
  if (searchText.length < 3) {
    throw new Error("Search text for name must be at least 3 characters long.");
  }
  const name = employee.name ? employee.name.S.toLowerCase() : "";
  //const employeeId = employee.employeeId ? employee.employeeId.N.toString() : ""; // Convert to string for comparison
  return name.includes(searchText.toLowerCase());
  //  || employeeId === searchText
};

const matchesBranch = (employeeBranch, branchFilter) => {
  for (const filter of branchFilter) {
    const phrases = filter.split(",").map((phrase) => phrase.trim());
    if (phrases.some((phrase) => employeeBranch.includes(phrase))) {
      return true;
    }
  }
  return false;
};

const isEmployeeIdExists = async (employeeId) => {
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    Key: { employeeId: { N: employeeId } },
  };
  const { Item } = await client.send(new GetItemCommand(params));
  return !!Item;
};

const isEmailExists = async (emailAddress) => {
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    FilterExpression: "officeEmailAddress = :email",
    ExpressionAttributeValues: {
      ":email": { S: emailAddress },
    },
    ProjectionExpression: "officeEmailAddress",
  };

  const command = new ScanCommand(params);
  const data = await client.send(command);
  return data.Items.length > 0;
};

const isEmailNotEmployeeIdExists = async (emailAddress, employeeId) => {
  console.log("in side isEmailNotEmployeeIdExists");
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    FilterExpression: "officeEmailAddress = :email AND employeeId <> :id",
    ExpressionAttributeValues: {
      ":email": { S: emailAddress },
      ":id": { N: employeeId },
    },
    ProjectionExpression: "officeEmailAddress",
  };
  const command = new ScanCommand(params);
  const data = await client.send(command);
  return data.Items.length > 0;
};

/////////////////////////////////////////////////////////////
const getEmployeesByRole = async (event) => {
  console.log("Get employees by role");
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
  try {
    const { role } = event.queryStringParameters;

    const params = {
      TableName: process.env.EMPLOYEE_TABLE,
      FilterExpression: "#role = :roleValue",
      ExpressionAttributeNames: {
        "#role": "role",
      },
      ExpressionAttributeValues: {
        ":roleValue": { S: role },
      },
    };

    const { Items } = await client.send(new ScanCommand(params));

    const sortedItems = Items.sort((a, b) => parseInt(a.employeeId.N) - parseInt(b.employeeId.N));
    const employees = sortedItems.map((item) => {
      const employee = unmarshall(item);
      return employee;
    });
    console.log({ employees });
    if (!employees || !employees.length > 0) {
      console.log("Employees details not found.");
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: httpStatusMessages.EMPLOYEES_DETAILS_NOT_FOUND,
      });
    } else {
      console.log("Successfully retrieved employee details.");
      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_EMPLOYEE_DETAILS,
        data: employees,
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

const checkEmployeeExistence = async (managerId) => {
  const params = {
    TableName: process.env.EMPLOYEE_TABLE,
    Key: { employeeId: { N: managerId } },
  };

  const command = new ScanCommand(params);
  const data = await client.send(command);
  return data.Items.length > 0;
};
module.exports = {
  createEmployee,
  updateEmployee,
  getEmployee,
  getAllEmployees,
  getEmployeesByRole,
};
