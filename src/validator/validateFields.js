const updateEmployeeAllowedFields = [
  "permanentAddress",
  "employeeId",
  "lastName",
  "contactNumber",
  "status",
  "passportNumber",
  "contactPerson",
  "firstName",
  "ssnNumber",
  "panNumber",
  "password",
  "joiningDate",
  "relievedDate",
  "dateOfBirth",
  "leaveStructure",
  "mobileNumber",
  "emergencyContactPerson",
  "department",
  "nationality",
  "personalEmailAddress",
  "emergencyContactNumber",
  "gender",
  "branchOffice",
  "presentAddress",
  "maritalStatus",
  "officialEmailId",
  "aadhaarNumber",
  "isAbsconded",
  "resignedDate",
  "createdDateTime",
  "updatedDateTime",
];

const updateMetadataAllowedFields = ["name", "type", "status", "updatedDateTime"];
const updateAssignmentAllowedFields = [
  "branchOffice",
  "department",
  "designation",
  "role",
  "coreTechnology",
  "framework",
  "reportingManager",
  "billableResource",
  "assignedProject",
  "onsite",
  "managerId",
];
const updateCertificationAllowedFields = ["technologyName", "certificationAuthority", "certifiedDate", "validityLastDate", "link", "updatedDateTime"];
/////////////////////////////////////////////////////////////
const updateDocumentAllowedFields = ["documentType", "documentName", "updateDate", "link", "updatedDateTime"];

module.exports = {
  updateEmployeeAllowedFields,
  updateMetadataAllowedFields,
  updateAssignmentAllowedFields,
  updateCertificationAllowedFields,
  updateDocumentAllowedFields,
};
