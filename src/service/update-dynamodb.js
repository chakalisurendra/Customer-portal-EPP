/*const { log } = require('../utils/logger');
const AWS = require('aws-sdk');
const { AppConfig, httpStatusCodes, responseCodes } = require('../environment/appconfig');
const { apiResponse } = require('../http-helpers/api-response');
const { apiError } = require('../http-helpers/api-error');
const { getLogObject, logInfo, logErr } = require('../utils/logger');
const { queryUserStoreOnVcmId } = require('./query-dynamodb');

const docClient = new AWS.DynamoDB.DocumentClient(AppConfig.DBConfig);

async function UpdateisCompleted(uuid) {
    const actvityName = "DynamoDb: UpdateisCompleted";

    try {
        const update_params_tracking = {
            TableName: AppConfig.memberTrackingTable,
            Key: {
                key_id: `${uuid}`,
                sk_key: "recoverOnlineId"
            },
            UpdateExpression: "set isCompleted = :isCompleted, createdDate = :createdDate",
            ExpressionAttributeValues: {
                ":isCompleted": true,
                ":createdDate": Math.round(new Date().getTime() / 1000)
            },
            ReturnValues: "UPDATED_NEW"
        };

        const save_data_tracking = await docClient.update(update_params_tracking).promise();
        return true;
    } catch (error) {
        throw error;
    }
}

async function updateBiometricFlag(vcmId, deviceid, flagValue, logEvent) {
    const activityName = "DynamoDb: updateDeviceDetails";
    try {
        let device = [];
        let currentTimestamp = Math.round(new Date().getTime() / 1000);

        if (flagValue == 1) {
            flagValue = true;
        } else {
            flagValue = false;
        }

        let deviceDetails = `${deviceid}|${flagValue}|${currentTimestamp}`;

        let userData = await queryUserStoreOnVcmId(vcmId, logEvent);
        console.log("member audit data");
        console.log(userData);

        var updatedDeviceArray = userData.device;

        if (userData.device !== undefined) {
            console.log("table data " + userData.device);
            var currentNumberOfDevices = userData.device.length;
            console.log("numer of devises   " + currentNumberOfDevices);
            var deviceExists = false;
            var existingDeviceNumber;

            for (var i = 0; i < currentNumberOfDevices; i++) {
                console.log("inside for - " + i);

                console.log("perticular data  " + userData.device[i]);
                let splitedUserData = userData.device[i].split("|");

                if (splitedUserData[1] == deviceid) {
                    console.log("inside if");
                    deviceExists = true;
                    existingDeviceNumber = i;
                    delete updatedDeviceArray[i];
                }
            }

            if (deviceExists) {
                updatedDeviceArray.push(`device${existingDeviceNumber}|${deviceDetails}`);
            } else {
                updatedDeviceArray.push(`device${currentNumberOfDevices}|${deviceDetails}`);
            }
        } else {
            updatedDeviceArray = [];
            updatedDeviceArray.push(`device0|${deviceDetails}`);
        }

        const update_params = {
            TableName: AppConfig.memberAuditlogTable,
            Key: {
                vcm_id: Number(vcmId),
                sk_key: "profile"
            },
            UpdateExpression: "set device = :device, updatedtime = :updatedtime",
            ExpressionAttributeValues: {
                ":device": updatedDeviceArray,
                ":updatedtime": Math.round(new Date().getTime() / 1000)
            },
            ReturnValues: "UPDATED_NEW"
        };

        console.log(update_params);

        let save_data = await docClient.update(update_params).promise();
        logInfo(logEvent, `${save_data} for ${vcmId}`, activityName);

        return save_data;
    } catch (error) {
        logErr(logEvent, "error occured while updating data into db", activityName);
        logErr(logEvent, error, activityName);
        throw error;
    }
}

async function registerNewDevice(vcmId, nickName, userAgent, sourceIp, timeStamp, exactDeviceId, unkId, expireOn, ttlDays, channel, loginLatitude, loginLongitude, actualDeviceName, logEvent) {
    const activityName = "DynamoDB: updateDynamoDbSaveSecurityQuestions";
    try {
        const device_params = {
            TableName: AppConfig.deviceRecognition,
            Item: {
                vcm_id: Number(vcmId),
                device_id: exactDeviceId,
                nickName: nickName,
                userAgent: userAgent,
                sourceIp: sourceIp,
                registeredTime: timeStamp,
                unkId: unkId,
                expireOn: expireOn,
                TTLConfigDays: ttlDays,
                channel: channel,
                latitude: loginLatitude,
                longitude: loginLongitude,
                actualDeviceName: actualDeviceName
            }
        };

        const save_data = await docClient.put(device_params).promise();
        logInfo(logEvent, `registerNewDevice DB=>${save_data}`, activityName);
        return save_data;
    } catch (error) {
        logErr(logEvent, "error occured while updating data into db", activityName);
        logErr(logEvent, error, activityName);
        throw error;
    }
}*/