const validateEmployeeDetails = (requestBody) => {
  const { employeeId, firstName, lastName, dateOfBirth, officeEmailAddress, branchOffice } = requestBody;

  // Check if required fields are missing
  if (!employeeId || !firstName || !lastName || !dateOfBirth || !officeEmailAddress || !branchOffice) {
    return false;
  } else if (!officeEmailAddress.endsWith("hyniva.com")) {
    throw new Error('Invalid officeEmailAddress domain. It should end with "hyniva.com".');
  }
  // You can add more specific validation logic for each field if needed
  return true;
};
const validateUpdateEmployeeDetails = (requestBody) => {
  console.log("validateUpdateEmployeeDetails method");

  const response = {
    validation: false,
    validationMessage: "Valid Data",
  };

  if (!validatePhone(requestBody.mobileNumber)) {
    response.validationMessage = "Invalid Mobile Number it will allow 10 to 16 digits, it will not allow Alphabets";
    return response;
  }
  if (!validatePhone(requestBody.contactNumber)) {
    response.validationMessage = "Invalid Contact Number it will allow 10 to 16 digits, it will not allow Alphabets";
    return response;
  }
  if (!validatePhone(requestBody.emergencyContactNumber)) {
    response.validationMessage = "Invalid Emergency Contact Number it will allow 10 to 16 digits, it will not allow Alphabets";
    return response;
  }
  if (!validateSsnNumber(requestBody.ssnNumber)) {
    response.validationMessage = "Invalid SSN Number it will allow only 9 digits, it will not allow Alphabets";
    return response;
  }
  if (!validateAadharNumber(requestBody.aadharNumber)) {
    response.validationMessage = "Invalid Aadhar Number it will allow only 12 digits, it will not allow Alphabets";
    return response;
  }
  if (!validatePassportNumber(requestBody.passportNumber)) {
    response.validationMessage = `Invalid Passport Number it will allow 8 to 12 digits, Example "AWTY12345678"`;
    return response;
  }
  if (!validateOfficeEmailAddress(requestBody.officeEmailAddress)) {
    response.validationMessage = "Invalid Office Email Address it will allow @hyniva.com";
    return response;
  }
  if (!validateEmailAddress(requestBody.personalEmailAddress)) {
    response.validationMessage = "Invalid Personal Email Address";
    return response;
  }
  if (!validateStatus(requestBody.status)) {
    response.validationMessage = "Invalid status. Status should be either 'active' or 'inactive'.";
    return response;
  }
  if (!validateGender(requestBody.gender)) {
    response.validationMessage = "Invalid gender. Gender should be either 'male' or 'female'.";
    return response;
  }
  if (!validatemaritalStatus(requestBody.maritalStatus)) {
    response.validationMessage = "Invalid marital Status. Marital Status should be either 'Single' or 'Married' or 'Divorced'.";
    return response;
  }
  if (!validateIsAbsconded(requestBody.absconded)) {
    response.validationMessage = "Invalid is Absconded. Is Absconded should be either 'Yes' or 'No'.";
    return response;
  }
  if (!validateDate(requestBody.joiningDate)) {
    response.validationMessage = `joiningDate should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  if (!validateDate(requestBody.resignedDate)) {
    response.validationMessage = `resignedDate should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  if (!validateDate(requestBody.relievedDate)) {
    response.validationMessage = `relievedDate should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  if (!validateDate(requestBody.dateOfBirth)) {
    response.validationMessage = `dateOfBirth should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  response.validation = true;
  return response;
};

const validatePhone = (phoneNumber) => {
  if (phoneNumber === null || phoneNumber === undefined) {
    return true;
  }
  const phoneNumberPattern = /^\d{10,16}$/;
  if (phoneNumber.toString().match(phoneNumberPattern)) {
    return true;
  } else {
    return false;
  }
};

const validateSsnNumber = (ssnNumber) => {
  if (ssnNumber === null || ssnNumber === undefined) {
    return true; // Allow null or undefined values
  }
  const numberPattern = /^\d{9}$/;
  if (numberPattern.test(ssnNumber)) {
    return true;
  } else {
    return false;
  }
};

const validateAadharNumber = (aadharNumber) => {
  if (aadharNumber === null || aadharNumber === undefined) {
    return true; // Allow null or undefined values
  }
  const numberPattern = /^\d{12}$/;
  if (numberPattern.test(aadharNumber)) {
    return true;
  } else {
    return false;
  }
};

const validatePassportNumber = (passportNumber) => {
  if (passportNumber === null || passportNumber === undefined) {
    return true; // Allow null or undefined values
  }
  const numberPattern = /^[A-Z]{4}\d{8}$/;
  if (numberPattern.test(passportNumber)) {
    return true;
  } else {
    return false;
  }
};

const validateOfficeEmailAddress = (officeEmailAddress) => {
  if (officeEmailAddress === null || officeEmailAddress === undefined) {
    return true; // Allow null or undefined values
  }
  const emailPattern = /^[^\s@]+@hyniva\.com$/;
  return emailPattern.test(officeEmailAddress);
};

const validateEmailAddress = (emailAddress) => {
  if (emailAddress === null || emailAddress === undefined) {
    return true; // Allow null or undefined values
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(emailAddress);
};

const validateDate = (date) => {
  if (date === null || date === undefined) {
    return true; // Allow null or undefined values
  }
  const datePattern = /^\d{2}-\d{2}-\d{4}$/;
  if (datePattern.test(date)) {
    return true;
  } else {
    return false;
  }
};

const validateIsAbsconded = (isAbsconded) => {
  if (isAbsconded === null || isAbsconded === undefined) {
    return true; // Allow null or undefined values
  }
  return ["Yes", "No"].includes(isAbsconded);
};

const validateStatus = (status) => {
  if (status === null || status === undefined) {
    return true; // Allow null or undefined values
  }
  return ["active", "inactive"].includes(status);
};

const validateGender = (gender) => {
  if (gender === null || gender === undefined) {
    return true; // Allow null or undefined values
  }
  return ["male", "female"].includes(gender);
};
const validatemaritalStatus = (maritalStatus) => {
  if (maritalStatus === null || maritalStatus === undefined) {
    return true; // Allow null or undefined values
  }
  return ["Single", "Married", "Divorced"].includes(maritalStatus);
};

const validateAssetDetails = (requestBody) => {
  const response = {
    validation: false,
    validationMessage: "Valid Data",
  };

  const { assetId, assetsType, serialNumber, status } = requestBody;
  const requiredProperties = ["assetId", "assetsType", "serialNumber", "status"];

  for (const property of requiredProperties) {
    if (!requestBody[property] || requestBody[property] === "") {
      response.validationMessage = `${property} is required`;
      return response;
    }
  }
  if (!validateStatus(requestBody.status)) {
    response.validationMessage = "Invalid status. Status should be either 'active' or 'inactive'.";
    return response;
  }

  response.validation = true;
  return response;
};

// =================================================================================

const validateMetadata = (requestBody) => {
  const response = {
    validation: false,
    validationMessage: "Valid Data",
  };

  const { name, type, status } = requestBody;
  const requiredProperties = ["name", "type", "status"];

  for (const property of requiredProperties) {
    if (!requestBody[property] || requestBody[property] === "") {
      response.validationMessage = `${property} is required`;
      return response;
    }
  }
  if (!validateStatus(requestBody.status)) {
    response.validationMessage = "Invalid status. Status should be either 'active' or 'inactive'.";
    return response;
  }

  response.validation = true;
  return response;
};

module.exports = {
  validateEmployeeDetails,
  validateUpdateEmployeeDetails,
  validateAssetDetails,
  validateMetadata,
};
