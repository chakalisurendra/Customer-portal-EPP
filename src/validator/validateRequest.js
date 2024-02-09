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
    validation: true,
    validationMessage: "Valid Data",
  };

  if (!validatePhone(requestBody.mobileNumber)) {
    response.validationMessage = "Invalid Mobile Number";
    return response;
  } else if (!validatePhone(requestBody.contactNumber)) {
    response.validationMessage = "Invalid Contact Number";
    return response;
  } else if (!validatePhone(requestBody.emergencyContactNumber)) {
    response.validationMessage = "Invalid Emergency Contact Number";
    return response;
  } else if (!validateSsnNumber(requestBody.ssnNumber)) {
    response.validationMessage = "Invalid SSN Number";
    return response;
  } else if (!validateAadharNumber(requestBody.aadharNumber)) {
    response.validationMessage = "Invalid Aadhar Number";
    return response;
  } else if (!validatePassportNumber(requestBody.passportNumber)) {
    response.validationMessage = "Invalid Passport Number";
    return response;
  } else if (!validateOfficeEmailAddress(requestBody.officeEmailAddress)) {
    response.validationMessage = "Invalid Office Email Address";
    return response;
  } else if (!validateEmailAddress(requestBody.personalEmailAddress)) {
    response.validationMessage = "Invalid Personal Email Address";
    return response;
  } else if (!validateStatus(requestBody.status)) {
    response.validationMessage = "Invalid status. Status should be either 'active' or 'inactive'.";
    return response;
  } else if (!validateGender(requestBody.gender)) {
    response.validationMessage = "Invalid gender. Gender should be either 'male' or 'female'.";
    return response;
  } else if (!validatemaritalStatus(requestBody.maritalStatus)) {
    response.validationMessage = "Invalid marital Status. Marital Status should be either 'Single' or 'Married' or 'Divorced'.";
    return response;
  } else if (!validateIsAbsconded(requestBody.absconded)) {
    response.validationMessage = "Invalid is Absconded. Is Absconded should be either 'Yes' or 'No'.";
    return response;
  } else if (!validateDate(requestBody.joiningDate)) {
    response.validationMessage = `joiningDate should be in format \"YYYY-MM-DD\"`;
    return response;
  } else if (!validateDate(requestBody.resignedDate)) {
    response.validationMessage = `resignedDate should be in format \"YYYY-MM-DD\"`;
    return response;
  } else if (!validateDate(requestBody.relievedDate)) {
    response.validationMessage = `relievedDate should be in format \"YYYY-MM-DD\"`;
    return response;
  } else if (!validateDate(requestBody.dateOfBirth)) {
    response.validationMessage = `dateOfBirth should be in format \"YYYY-MM-DD\"`;
    return response;
  }
  return response;
};

const validatePhone = (phoneNumber) => {
  console.log("validatePhone method");

  if (phoneNumber === null || phoneNumber === undefined) {
    return true; // Allow null or undefined values
  }
  console.log("validatePhone not null");

  const numberPattern = /^\d+$/;
  return numberPattern.test(phoneNumber) && phoneNumber.length < 17;
};
const validateSsnNumber = (ssnNumber) => {
  if (ssnNumber === null || ssnNumber === undefined) {
    return true; // Allow null or undefined values
  }
  const numberPattern = /^\d+$/;
  return numberPattern.test(ssnNumber) && ssnNumber.length < 10;
};
const validateAadharNumber = (aadharNumber) => {
  if (aadharNumber === null || aadharNumber === undefined) {
    return true; // Allow null or undefined values
  }
  const numberPattern = /^\d+$/;
  return numberPattern.test(aadharNumber) && aadharNumber.length < 13;
};
const validatePassportNumber = (passportNumber) => {
  if (passportNumber === null || passportNumber === undefined) {
    return true; // Allow null or undefined values
  }
  const numberPattern = /^\d+$/;
  return numberPattern.test(passportNumber) && passportNumber.length > 8 && passportNumber.length < 13;
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
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  return datePattern.test(date);
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
  ["male", "female"].includes(gender);
};

const validatemaritalStatus = (maritalStatus) => {
  if (maritalStatus === null || maritalStatus === undefined) {
    return true; // Allow null or undefined values
  }
  return ["Single", "Married", "Divorced"].includes(maritalStatus);
};
module.exports = {
  validateEmployeeDetails,
  validateUpdateEmployeeDetails,
  validatePhone,
  validateSsnNumber,
  validateAadharNumber,
  validatePassportNumber,
  validateOfficeEmailAddress,
  validateEmailAddress,
};
