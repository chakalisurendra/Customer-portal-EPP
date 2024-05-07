const { Pool } = require("pg");
const moment = require("moment");
const { httpStatusCodes, httpStatusMessages } = require("../../environment/appconfig");
const path = require("path");
require("dotenv").config({
  override: true,
  path: path.join(__dirname, "development.env"),
});

const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT, 
});

const getMetadata = async (event) => {
  console.log("Get metadata details");
  const response = { statusCode: httpStatusCodes.SUCCESS };
  try {
    const { metadataId } = event.queryStringParameters;

    const query = {
      text: "SELECT * FROM metadata WHERE metadataId = $1",
      values: [metadataId],
    };

    const result = await pool.query(query);
    if (result.rows.length === 0) {
      console.log("Metadata details not found.");
      response.statusCode = httpStatusCodes.NOT_FOUND;
      response.body = JSON.stringify({
        message: httpStatusMessages.METADATA_NOT_FOUND,
      });
    } else {
      console.log("Successfully retrieved metadata details.");
      response.body = JSON.stringify({
        message: httpStatusMessages.SUCCESSFULLY_RETRIEVED_METADATA,
        data: result.rows[0], // Assuming there's only one row per metadataId
      });
    }
  } catch (e) {
    console.error(e);
    response.statusCode = e.statusCode || httpStatusCodes.INTERNAL_SERVER_ERROR;
    response.body = JSON.stringify({
      message: httpStatusMessages.FAILED_TO_RETRIEVE_METADATA,
      errorMsg: e.message,
    });
  }
  return response;
};

module.exports = {
  getMetadata,
};
