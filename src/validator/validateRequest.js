// const moment = require("moment");
// const currentDate = Date.now();
// const formattedDate = moment(currentDate).format("MM-DD-YYYY");

const validateEmployeeDetails = (requestBody) => {
  const response = {
    validation: false,
    validationMessage: "Valid Data",
  };
  const requiredProperties = ["firstName", "lastName", "dateOfBirth", "officialEmailId", "branchOffice", "designation"];

  for (const property of requiredProperties) {
    if (!requestBody[property] || requestBody[property] === "") {
      response.validationMessage = `${property} is required`;
      return response;
    }
  }
  if (!requestBody.officialEmailId.endsWith("hyniva.com")) {
    response.validationMessage = `Invalid officialEmailId domain. It should end with "hyniva.com".`;
    return response;
  }

  if (!validateDate(requestBody.dateOfBirth)) {
    response.validationMessage = `Date Of Birth  should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  if (!validatePastAndCurrentDate(requestBody.dateOfBirth)) {
    response.validationMessage = `Date Of Birth is valid (current or past)`;
    return response;
  }
  if (!validateDate(requestBody.joiningDate)) {
    response.validationMessage = `joiningDate should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  if (!validatePastAndCurrentDate(requestBody.joiningDate)) {
    response.validationMessage = `joiningDate is valid (current or past)`;
    return response;
  }
  if (!validateDate(requestBody.resignedDate)) {
    response.validationMessage = `resignedDate should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  if (!validateFeatureAndCurrentDate(requestBody.resignedDate)) {
    response.validationMessage = `Resigned date is valid (current or past)`;
    return response;
  }
  if (!validateDate(requestBody.relievedDate)) {
    response.validationMessage = `relievedDate should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  // if (!validateRelievedDate(requestBody.resignedDate, requestBody.relievedDate)) {
  //   response.validationMessage = `relievedDate is valid, it has to be feature date of resignedDate`;
  //   return response;
  // }
  if (!validatePanNumber(requestBody.panNumber)) {
    response.validationMessage = `Invalid PAN Number. PAN Number should be in the format ABCDE1234F`;
    return response;
  }
  response.validation = true;
  return response;
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
  if (!validateOfficialEmailId(requestBody.officialEmailId)) {
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
  if (!validateDate(requestBody.dateOfBirth)) {
    response.validationMessage = `Date Of Birth should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  if (!validatePastAndCurrentDate(requestBody.dateOfBirth)) {
    response.validationMessage = `Date Of Birth is valid (current or past)`;
    return response;
  }
  if (!validateDate(requestBody.joiningDate)) {
    response.validationMessage = `joiningDate should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  if (!validatePastAndCurrentDate(requestBody.joiningDate)) {
    response.validationMessage = `joiningDate is valid (current or past)`;
    return response;
  }
  if (!validateDate(requestBody.resignedDate)) {
    response.validationMessage = `resignedDate should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  if (!validateFeatureAndCurrentDate(requestBody.resignedDate)) {
    response.validationMessage = `resignedDate is valid (current or past)`;
    return response;
  }
  if (!validateDate(requestBody.relievedDate)) {
    response.validationMessage = `relievedDate should be in format \"MM-DD-YYYY\"`;
    return response;
  }
  // if (!validateRelievedDate(requestBody.resignedDate, requestBody.relievedDate)) {
  //   response.validationMessage = `relievedDate is valid, it has to be feature date of resignedDate`;
  //   return response;
  // }
  if (!validatePanNumber(requestBody.panNumber)) {
    response.validationMessage = `Invalid PAN Number. PAN Number should be in the format ABCDE1234F`;
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

const validateOfficialEmailId = (officialEmailId) => {
  if (officialEmailId === null || officialEmailId === undefined) {
    return true; // Allow null or undefined values
  }
  const emailPattern = /^[^\s@]+@hyniva\.com$/;
  return emailPattern.test(officialEmailId);
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

const validatePastAndCurrentDate = (date) => {
  if (date === null || date === undefined) {
    return true;
  }
  const currentDate = new Date();
  const inputDate = new Date(date);
  if (isNaN(inputDate.getTime())) {
    return false;
  }
  if (inputDate <= currentDate) {
    return true;
  } else {
    return false;
  }
};

const validateFeatureAndCurrentDate = (date) => {
  if (date === null || date === undefined) {
    return true;
  }
  const currentDate = new Date();
  const inputDate = new Date(date);
  if (isNaN(inputDate.getTime())) {
    return false;
  }
  if (inputDate >= currentDate) {
    return true;
  } else {
    return false;
  }
};

const validatePanNumber = (aadharNumber) => {
  if (aadharNumber === null || aadharNumber === undefined) {
    return true; // Allow null or undefined values
  }
  const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
  if (panRegex.test(aadharNumber)) {
    return true;
  } else {
    return false;
  }
};

// const validateRelievedDate = (resignedDate, relievedDate) => {
//   if (relievedDate === null || relievedDate === undefined) {
//     return true;
//   }
//   const currentDate = new Date();
//   const resignedDate1 = new Date(resignedDate);
//   const relievedDate1 = new Date(relievedDate);
//   if (isNaN(relievedDate1.getTime())) {
//     return false;
//   }
//   if (isNaN(resignedDate1.getTime())) {
//     return false;
//   }
//   if (relievedDate1 >= resignedDate1 || resignedDate1 >= currentDate) {
//     return true;
//   } else {
//     return false;
//   }
// };

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

const validateMetadataUpdata = (requestBody) => {
  const response = {
    validation: false,
    validationMessage: "Valid Data",
  };

  if (!validateStatus(requestBody.status)) {
    response.validationMessage = "Invalid status. Status should be either 'active' or 'inactive'.";
    return response;
  }

  response.validation = true;
  return response;
};

const validateFinalSettlement = (requestBody) => {
  const response = {
    validation: false,
    validationMessage: "Valid Data",
  };

  const { employeeId, panNumber, bonus, unpaidSalary, variablePay, unavailedLeaves, leaveEncashment } = requestBody;
  const requiredProperties = ["panNumber", "employeeId", "basicPay", "bonus", "variablePay", "enCashment", "unpaidSalary", "unavailedLeaves", "leaveEncashment", "type"];

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
  validateMetadataUpdata,
  validateFinalSettlement,
};
