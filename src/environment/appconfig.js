const httpStatusCodes = {
  BAD_REQUEST: "400",
  INTERNAL_SERVER_ERROR: "500",
  SUCCESS: "200",
  NOT_FOUND: "404",
  UNAUTHORIZED: "401",
};

const httpStatusMessages = {
  SUCCESSFULLY_CREATED_EMPLOYEE_DETAILS: "Successfully created employee details.",
  FAILED_TO_CREATE_EMPLOYEE_DETAILS: "Failed to create employee details.",
  FAILED_TO_RETRIEVE_EMPLOYEE_DETAILS: "Failed to retrieve Employee details.",
  SUCCESSFULLY_RETRIEVED_EMPLOYEES_DETAILS: "Successfully retrieved Employees details.",
  SUCCESSFULLY_RETRIEVED_EMPLOYEE_DETAILS: "Successfully retrieved Employee details.",
  EMPLOYEE_DETAILS_NOT_FOUND: "Employee details not found.",
  EMPLOYEE_ID_REQUIRED: "Employee Id is required",
  SUCCESSFULLY_UPDATED_EMPLOYEE_DETAILS: "Successfully updated Employee details.",
  FAILED_TO_UPDATED_EMPLOYEE_DETAILS: "Failed to updated Employee details.",
  SUCCESSFULLY_CREATED_ASSET_DETAILS: "Successfully created asset details.",
  FAILED_TO_CREATE_ASSET_DETAILS: "Failed to create asset details.",
  EMPLOYEE_ALREADY_EXISTS: "EmployeeId already exists.",
  ASSET_ALREADY_EXISTS: "Assetid already exists.",
  EMPLOYEE_ALREADY_EXISTS_IN_ASSETS: "EmployeeId already exists in asset.",
  SUCCESSFULLY_RETRIEVED_ASSET_INFORMATION: "Successfully retrieved Asset information.",
  ASSET_INFORMATION_NOT_FOUND: "Asset information not found.",
  FAILED_TO_RETRIEVE_ASSET_INFORMATION: "Failed to retrieve Asset information.",
  SUCCESSFULLY_CREATED_METADATA: "Successfully created metadata.",
  FAILED_TO_CREATE_METADATA: "Failed to create metadata.",
  METADATA_ALREADY_EXISTS: "Metadata already exists.",
  SUCCESSFULLY_RETRIEVED_METADATA: "Successfully retrieved metadata.",
  FAILED_TO_RETRIEVE_METADATA: "Failed to retrieve metadata.",
  METADATA_NOT_FOUND: "Metadata not found.",
  METADATA_ID_REQUIRED: "Metadata Id is required",
};

module.exports = {
  httpStatusCodes,
  httpStatusMessages,
};
