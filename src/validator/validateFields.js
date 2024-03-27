const updateEmployeeAllowedFields = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "officeEmailAddress",
  "branchOffice",
  "password",
  "gender",
  "ssnNumber",
  "aadharNumber",
  "maritalStatus",
  "nationality",
  "passportNumber",
  "mobileNumber",
  "permanentAddress",
  "contactPerson",
  "personalEmailAddress",
  "presentAddress",
  "contactNumber",
  "joiningDate",
  "emergencyContactPerson",
  "designation",
  "emergencyContactNumber",
  "resignedDate",
  "relievedDate",
  "leaveStructure",
  "department",
  "isAbsconded",
  "status",
  "updatedDateTime",
];

const updateMetadataAllowedFields = ["name", "type", "status", "updatedDateTime"];
const updateAssignmentAllowedFields = ["branchOffice", "department", "designation", "coreTechnology", "framework", "reportingManager", "billableResource", "assignedProject", "onsite"];
module.exports = {
  updateEmployeeAllowedFields,
  updateMetadataAllowedFields,
  updateAssignmentAllowedFields,
};
