const {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  GetItemCommand,
  ScanCommand,
  QueryCommand,
} = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const client = new DynamoDBClient();
const {
  httpStatusCodes,
  httpStatusMessages,
} = require("../../environment/appconfig");
const {
  validateCreateCertification,
} = require("../../validator/validateRequest");
const { autoIncreamentId } = require("../../utils/comman");
const currentDate = Date.now(); // get the current date and time in milliseconds
const formattedDate = moment(currentDate).format("YYYY-MM-DD HH:mm:ss"); // formatting date
const parseMultipart = require("parse-multipart");
const BUCKET = "dev-employees-certification-documents";
const AWS = require("aws-sdk");
const path = require("path");
const s3 = new AWS.S3();

const createCertification = async (event) => {
  console.log("Create Certification details");
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
  try {
    const requestBody = JSON.parse(event.body);

    const validationResponse = validateCreateCertification(requestBody);
    console.log(
      `Validation: ${validationResponse.validation} Message: ${validationResponse.validationMessage}`
    );
    if (!validationResponse.validation) {
      console.log(validationResponse.validationMessage);
      response.statusCode = httpStatusCodes.BAD_REQUEST;
      response.body = JSON.stringify({
        message: validationResponse.validationMessage,
      });
      return response;
    }

    const newCertificationId = await autoIncreamentId(
      process.env.CERTIFICATION_TABLE,
      "certificationId"
    );

    // Check if an Certification already exists for the employee
    const existingCertification = await getCertificationByEmployee(
      requestBody.employeeId
    );
    if (existingCertification) {
      throw new Error(
        "A Certification Details already exists for Employee ID."
      );
    }

    async function getCertificationByEmployee(employeeId) {
      const params = {
        TableName: process.env.CERTIFICATION_TABLE,
        FilterExpression: "employeeId = :employeeId",
        ExpressionAttributeValues: {
          ":employeeId": { S: employeeId },
        },
      };

      try {
        const result = await client.send(new ScanCommand(params));
        return result.Items.length > 0;
      } catch (error) {
        console.error("Error retrieving cerification by employeeId:", error);
        throw error;
      }
    }

    const checkCerticationExistence = async (employeeId) => {
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
    await checkCerticationExistence(requestBody.employeeId);

    const params = {
      TableName: process.env.CERTIFICATION_TABLE,
      Item: marshall({
        certificationId: newCertificationId,
        employeeId: requestBody.employeeId,
        technologyName: requestBody.technologyName,
        certificationAuthority: requestBody.certificationAuthority,
        certifiedDate: requestBody.certifiedDate,
        validityLastDate: requestBody.validityLastDate,
        createdDateTime: formattedDate,
        updatedDateTime: null,
      }),
    };

    await client.send(new PutItemCommand(params));
    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_CREATED_CERTIFICATION_DETAILS,
      certificationId: newCertificationId,
      employeeId: requestBody.employeeId,
    });
  } catch (e) {
    console.error(e);
    response.statusCode = httpStatusCodes.BAD_REQUEST;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_CREATE_CERTIFICATION_DETAILS,
      errorMsg: e.message,
      errorStack: e.stack,
    });
  }
  return response;
};

const updateCertification = async (event) => {
  console.log("update certification details");
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
  try {
    const requestBody = JSON.parse(event.body);
    console.log("Request Body:", requestBody);
    const { certificationId, employeeId } = event.queryStringParameters;

    const validateCertificatonParams = {
      TableName: process.env.CERTIFICATION_TABLE,
      Key: {
        certificationId: { N: certificationId },
      },
    };
    const { Item } = await client.send(
      new GetItemCommand(validateCertificatonParams)
    );
    console.log({ Item });
    if (!Item) {
      console.log("Certification details not found.");
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: "Certification details not found.",
      });
      return response;
    }
    const employeePermission = await employeePermissions(employeeId);

    const objKeys = Object.keys(requestBody).filter((key) =>
      updateCertificationAllowedFields.includes(key)
    );
    console.log(`Certification with objKeys ${objKeys} `);
    const validationResponse = validateUpdateCertificationDetails(requestBody);
    console.log(
      `valdation : ${validationResponse.validation} message: ${validationResponse.validationMessage} `
    );

    if (!validationResponse.validation) {
      console.log(validationResponse.validationMessage);
      response.statusCode = 400;
      response.body = JSON.stringify({
        message: validationResponse.validationMessage,
      });
      return response;
    }

    const currentDate = Date.now();
    const updateDate = moment(currentDate).format("MM-DD-YYYY HH:mm:ss");
    const params = {
      TableName: process.env.CERTIFICATION_TABLE,
      Key: { certificationId: { N: certificationId } },
      UpdateExpression: `SET ${objKeys
        .map((_, index) => `#key${index} = :value${index}`)
        .join(", ")}, #updatedDateTime = :updatedDateTime`,
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
    console.log("Successfully updated Certification details.");
    response.body = JSON.stringify({
      message: httpStatusMessages.SUCCESSFULLY_UPDATED_CERTIFICATION_DETAILS,
      certificationId: certificationId,
    });
  } catch (e) {
    console.error(e);
    response.statusCode = 400;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_UPDATE_CERTIFICATION_DETAILS,
      errorMsg: e.message,
    });
  }
  return response;
};

const uploadCertification = async (event) => {
  try {
    const certificationId = event.pathParameters.certificationId;

    if (!certificationId) {
      throw new Error("certificationId is required");
    }
    // Check if an certification already exists for the employee
    const existingCertification = await getCertificationByEmployee(
      event.pathParameters.certificationId
    );
    if (!existingCertification) {
      throw new Error("Certification Details Not found.");
    }
    async function getCertificationByEmployee(certificationId) {
      const params = {
        TableName: process.env.CERTIFICATION_TABLE,
        KeyConditionExpression: "certificationId = :certificationId",
        ExpressionAttributeValues: {
          ":certificationId": { N: certificationId.toString() },
        },
      };

      try {
        const result = await client.send(new QueryCommand(params));
        return result.Items.length > 0;
      } catch (error) {
        console.error(
          "Error retrieving certification by certificationId:",
          error
        );
        throw error;
      }
    }

    const { filename, data } = extractFile(event);

    // Modify filename to include certificationId
    const modifiedFilename = `${certificationId}_${filename.replace(
      /\s/g,
      "_"
    )}`;

    // Upload file to S3
    await s3
      .putObject({
        Bucket: BUCKET,
        Key: modifiedFilename,
        Body: data,
      })
      .promise();

    // Construct S3 object URL
    const s3ObjectUrl = `https://${BUCKET}.s3.amazonaws.com/${modifiedFilename}`;

    await client.send(
      new UpdateItemCommand({
        TableName: process.env.CERTIFICATION_TABLE,
        Key: {
          certificationId: { N: certificationId.toString() },
        },
        UpdateExpression: "SET link = :link",
        ExpressionAttributeValues: {
          ":link": { S: s3ObjectUrl },
        },
        ReturnValues: "ALL_NEW", // Return the updated item
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        link: s3ObjectUrl,
        message: "Certification Document updated successfully",
      }),
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (err) {
    console.log("error-----", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    };
  }
};

function extractFile(event) {
  const contentType = event.headers["Content-Type"];
  if (!contentType) {
    throw new Error("Content-Type header is missing in the request.");
  }

  const boundary = parseMultipart.getBoundary(contentType);
  if (!boundary) {
    throw new Error(
      "Unable to determine the boundary from the Content-Type header."
    );
  }

  const parts = parseMultipart.Parse(
    Buffer.from(event.body, "base64"),
    boundary
  );

  if (!parts || parts.length === 0) {
    throw new Error("No parts found in the multipart request.");
  }

  const [{ filename, data }] = parts;

  if (!filename || !data) {
    throw new Error(
      "Invalid or missing file name or data in the multipart request."
    );
  }

  const fileType = path.extname(filename).toLowerCase();
  if (fileType !== ".pdf") {
    throw new Error("Invalid file type. Only PDF files are allowed.");
  }

  // Check file size in binary format
  const fileSizeInMB = data.length / (1024 * 1024); // Convert bytes to MB
  const maxSizeInMB = 3;
  if (fileSizeInMB > maxSizeInMB) {
    throw new Error(
      `File size exceeds the maximum limit of ${maxSizeInMB} MB.`
    );
  }

  return {
    filename,
    data,
  };
}

const employeePermissions = async (employeeId) => {
  console.log(`Inside employeePermissions`);
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
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
  const role = Item && Item.role && Item.role.S;
  console.log(`role ${role} `);
  if (role === "hr" || role === "developer" || role === "manager") {
    console.log(`User have Permission`);
  } else {
    console.log(`User not have Permission`);
    response.statusCode = 404;
    response.body = JSON.stringify({
      message: `User not have Permission`,
    });
    return response;
  }
};

module.exports = {
  createCertification,
  uploadCertification,
};
