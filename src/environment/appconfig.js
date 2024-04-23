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
  FAILED_TO_UPDATE_EMPLOYEE_DETAILS: "Failed to updated Employee details.",
  SUCCESSFULLY_CREATED_ASSET_DETAILS: "Successfully created asset details.",
  FAILED_TO_CREATE_ASSET_DETAILS: "Failed to create asset details.",
  EMPLOYEE_ALREADY_EXISTS: "EmployeeId already exists.",
  ASSET_ALREADY_EXISTS: "Assetid already exists.",
  EMPLOYEE_ALREADY_EXISTS_IN_ASSETS: "EmployeeId already exists in asset.",
  SUCCESSFULLY_RETRIEVED_ASSET_INFORMATION: "Successfully retrieved Asset information.",
  ASSET_INFORMATION_NOT_FOUND: "Asset information not found.",
  FAILED_TO_RETRIEVE_ASSET_INFORMATION: "Failed to retrieve Asset information.",
  FAILED_TO_UPDATE_ASSSET_DETAILS: "Failed to update assset details.",
  SUCCESSFULLY_UPDATED_ASSSET_DETAILS: "Successfully updated assset details.",
  FAILED_TO_UPDATE_ASSIGNMENT_DETAILS: "Failed to update Assignment information.",
  SUCCESSFULLY_CREATED_METADATA: "Successfully created metadata.",
  FAILED_TO_CREATE_METADATA: "Failed to create metadata.",
  METADATA_ALREADY_EXISTS: "Metadata already exists.",
  SUCCESSFULLY_RETRIEVED_METADATA: "Successfully retrieved metadata.",
  FAILED_TO_RETRIEVE_METADATA: "Failed to retrieve metadata.",
  METADATA_NOT_FOUND: "Metadata not found.",
  METADATA_ID_REQUIRED: "Metadata Id is required",
  FAILED_TO_RETRIEVE_METADATA_DETAILS: "Failed to retrieve Metadata Details.",
  SUCCESSFULLY_RETRIEVED_METADATA_DETAILS: "Successfully retrieved metadata.",
  METADATA_DETAILS_NOT_FOUND: "Metadata details not found.",
  SUCCESSFULLY_CREATED_BANK_DETAILS: "Successfully created baank details.",
  FAILED_TO_CREATE_BANK_DETAILS: "Failed to create bank details.",
  SUCCESSFULLY_RETRIEVED_BANK_DETAILS_FOR_EMPLOYEE: "Successfully retrived bank details for employee",
  FAILED_TO_RETRIEVE_BANK_DETAILS_FOR_EMPLOYEE: "Failed to retrived bank details for employee",
  BANK_DETAILS_NOT_FOUND_FOR_EMPLOYEE: " bank details not found for employee",
  FAILED_TO_UPDATE_BANK_DETAILS: "failed to update bank details",
  SUCCESSFULLY_UPDATED_BANK_DETAILS: "successfully updated bank details",
  FAILED_TO_UPDATE_METADATA: "Failed to update metadata",
  SUCCESSFULLY_UPDATED_METADATA: "Successfully updated metadata",
  SUCCESSFULLY_UPDATED_PF_ESI_DETAILS : 'successfully updated PF ESI details',
  SUCCESSFULLY_CREATED_PF_ESI_DETAILS : 'successfully created PF ESI details',
  FAILED_TO_CREATE_OR_UPDATE_PF_DETAILS : 'failed to create or update PF ESI details',
  SUCCESSFULLY_CREATED_ASSIGNMENT_DETAILS : 'Successfully created assignment details.',
  FAILED_TO_CREATE_ASSIGNMENT_DETAILS : 'Failed to create assignment details.',
  ASSIGNMENTS_NOT_FOUND_FOR_EMPLOYEE : 'Assignment not found for employee',
  FAILED_TO_RETRIEVE_ASSIGNMENTS : 'failed to retrive assignments',
  SUCCESSFULLY_UPDATED_ASSIGNMENT_DETAILS : 'successfully updated assignment details',
  SUCCESSFULLY_RETRIEVED_ASSIGNMENT_FOR_EMPLOYEE : 'successfully retrieved assignments for the employee',
  SUCCESSFULLY_CREATED_PAYROLL_DETAILS : "successfully created payroll details.",
  FAILED_TO_CREATE_PAYROLL_DETAILS : "Failed to create payroll details.",
  SUCCESSFULLY_RETRIEVED_PF_ESI_DETAILS_FOR_EMPLOYEE : 'Successfully retrived PF ESI details for employee',
  FAILED_TO_RETRIEVE_PF_ESI_DETAILS_FOR_EMPLOYEE : 'Failed to retrived PF ESI details for employee',
  PF_ESI_NOT_FOUND_FOR_EMPLOYEE : 'PF ESI Details not found for employee',
  FAILED_TO_RETRIEVE_EMPLOYEES_DETAILS : 'failed to retrive employees details',
  EMPLOYEES_DETAILS_NOT_FOUND : 'Employees details not found',
  PAYROLL_NOT_FOUND_FOR_EMPLOYEE : "Payroll Not found for employee.",
  SUCCESSFULLY_RETRIEVED_PAYROLL_FOR_EMPLOYEE : "Successfully retrieved payroll detail.",
  FAILED_TO_CREATE_EDUCATION_DETAILS : "Failed to create education details.",
  SUCCESSFULLY_CREATED_EDUCATION_DETAILS: "Successfully created education details.",
  ////////////////////////////////////
  CERTIFICATION_ID_REQUIRED: "Certification Id is required",
   SUCCESSFULLY_UPDATED_CERTIFICATION_DETAILS: "Successfully updated Certification details.",
  FAILED_TO_UPDATE_CERTIFICATION_DETAILS: "Failed to update Certification details.",

};

module.exports = {
  httpStatusCodes,
  httpStatusMessages,
};
