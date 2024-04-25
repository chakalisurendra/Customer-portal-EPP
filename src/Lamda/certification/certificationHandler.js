const { DynamoDBClient, PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand, ScanCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const moment = require("moment");
const client = new DynamoDBClient();
const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");
const { validateUpdateCertificationDetails } = require("../../validator/validateRequest");
const { updateCertificationAllowedFields } = require("../../validator/validateFields");
const parseMultipart = require("parse-multipart");
const BUCKET = "dev-employees-certification-documents";
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

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
    const { Item } = await client.send(new GetItemCommand(validateCertificatonParams));
    console.log({ Item });
    if (!Item) {
      console.log("Certification details not found.");
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: "Certification details not found.",
      });
      return response;
    }

    const getItemParams = {
      TableName: process.env.EMPLOYEE_TABLE,
      Key: { employeeId: { N: employeeId } },
    };
    const result = await client.send(new GetItemCommand(getItemParams));
    if (!result.Item) {
      console.log(`Employee with employeeId ${employeeId} not found`);
      response.statusCode = 404;
      response.body = JSON.stringify({
        message: `Employee with employeeId ${employeeId} not found`,
      });
      return response;
    }

    const name = "Edit_Education_And_Certification";
    const permissionParams = {
      TableName: process.env.USER_PERMSSION_TABLE,
      FilterExpression: "#name = :nameValue",
      ExpressionAttributeNames: {
        "#name": "name",
      },
      ExpressionAttributeValues: {
        ":nameValue": { S: name },
      },
    };

    const permission = await client.send(new ScanCommand(permissionParams));
    if (!permission.Items) {
      console.log(`Permission ${name} not found`);
      response.statusCode = 404;
      response.body = JSON.stringify({
        message: `Permission ${name} not found`,
      });
      return response;
    }
    console.log(`permission ${permission.Items[0]}`);

    if (true === permission.Items[0].hr.BOOL || true === permission.Items[0].developer.BOOL) {
      console.log(`User has Permission ${name}`);
    } else {
      console.log(`User not have Permission ${name}`);
      response.statusCode = 404;
      response.body = JSON.stringify({
        message: `User not have Permission ${name}`,
      });
      return response;
    }

    const objKeys = Object.keys(requestBody).filter((key) => updateCertificationAllowedFields.includes(key));
    console.log(`Certification with objKeys ${objKeys} `);
    const validationResponse = validateUpdateCertificationDetails(requestBody);
    console.log(`valdation : ${validationResponse.validation} message: ${validationResponse.validationMessage} `);

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
  console.log("Upload certification details");
  const response = {
    statusCode: httpStatusCodes.SUCCESS,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };
  try {
    // const requestBody = JSON.parse(event.body);
    // console.log("Request Body:", requestBody);
    const certificationId = event.queryStringParameters && event.queryStringParameters.certificationId;

    if (!certificationId) {
      console.log("Certification Id is required");
      throw new Error(httpStatusMessages.CERTIFICATION_ID_REQUIRED);
    }

    const getItemParams = {
      TableName: process.env.CERTIFICATION_TABLE,
      Key: { certificationId: { N: certificationId } },
    };
    const { Item } = await client.send(new GetItemCommand(getItemParams));
    if (!Item) {
      console.log(`Certification with certificationId ${certificationId} not found`);
      response.statusCode = 404;
      response.body = JSON.stringify({
        message: `Certification with certificationId ${certificationId} not found`,
      });
      return response;
    }

    const { filename, data } = extractFile(event);

    // Upload file to S3
    await s3
      .putObject({
        Bucket: BUCKET,
        Key: filename,
        Body: data,
      })
      .promise();

    // Construct S3 object URL
    const s3ObjectUrl = `https://${BUCKET}.s3.amazonaws.com/${filename}`;

    // Update item in DynamoDB
    await client.send(
      new UpdateItemCommand({
        TableName: process.env.CERTIFICATION_TABLE,
        Key: {
          certificationId: { N: certificationId },
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
        message: "Certification record updated successfully",
      }),
    };
  } catch (err) {
    console.log("error-----", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
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
    throw new Error("Unable to determine the boundary from the Content-Type header.");
  }

  const parts = parseMultipart.Parse(Buffer.from(event.body, "base64"), boundary);

  if (!parts || parts.length === 0) {
    throw new Error("No parts found in the multipart request.");
  }

  const [{ filename, data }] = parts;

  if (!filename || !data) {
    throw new Error("Invalid or missing file name or data in the multipart request.");
  }

  // Check file size (assuming data is in binary format)
  const fileSizeInMB = data.length / (1024 * 1024); // Convert bytes to MB
  const maxSizeInMB = 3;
  if (fileSizeInMB > maxSizeInMB) {
    throw new Error(`File size exceeds the maximum limit of ${maxSizeInMB} MB.`);
  }

  return {
    filename,
    data,
  };
}

module.exports = {
  updateCertification,
  uploadCertification,
};
