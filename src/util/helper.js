"use strict"
const path = require("path")
const _ = require("underscore")
const crypto = require("crypto")
const axios = require("axios")
const { METHOD, MESSAGE, SCHEMA, TABLE, RDBMS } = require("./constant")
const moment = require("moment")
const moment_timezone = require("moment-timezone")
const Dao = require("../util/dao")
const log = require("../util/log")

function generateRandomString(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let randomString = ""
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(characters.length)
        randomString += characters[randomIndex]
    }
    return randomString.toUpperCase()
}

const is_null_or_empty = async value => {
    return value === null || value === undefined || (typeof value === "string" && value.trim() === "")
}

const generate_error_response = () => {
    return { status: false, code: 500, message: MESSAGE.INTERNAL_SERVER_ERROR }
}

/**
 * Documentation of generate response function:
 *
 * method     - must either be 'create', 'read', 'update' or 'delete'
 *
 * feature_name   - the name of the resources that are inserted/updated/deleted/read.
 *              Example: if the service is used to create a user, feature_name will be 'user'
 *
 * status_code - HTTP status code
 *
 * data       - data that will be included in response
 *
 * success_msg - custom success message that will be included in response
 *
 * err_msg     - custom error message that will be included in response
 *
 **/
const generate_response = ({ status_code, method, feature_name, data, total, success_msg, err_msg }) => {
    let response = { code: status_code, status: false }
    let message = ""
    if (status_code === 200) _.extend(response, { status: true })
    switch (method) {
        case METHOD.CREATE:
            if (status_code === 200) message = success_msg ? success_msg : `${feature_name.charAt(0).toUpperCase() + feature_name.slice(1).toLowerCase()} has been saved`
            else if (status_code === 409) message = success_msg ? success_msg : `${feature_name.charAt(0).toUpperCase() + feature_name.slice(1).toLowerCase()} id already exists! Please give a unique ID`
            else message = err_msg ? err_msg : `${feature_name.charAt(0).toUpperCase() + feature_name.slice(1).toLowerCase()} has not been saved`
            break
        case METHOD.READ:
            if (status_code === 200 && data) message = success_msg ? success_msg : `${feature_name.charAt(0).toUpperCase() + feature_name.slice(1).toLowerCase()} ${(data?.rows && Array.isArray(data?.rows)) || (data && Array.isArray(data)) ? "list" : "details"} found`
            else message = err_msg ? err_msg : `${feature_name.charAt(0).toUpperCase() + feature_name.slice(1).toLowerCase()} not found`
            break
        case METHOD.UPDATE:
            if (status_code === 200) message = success_msg ? success_msg : `${feature_name.charAt(0).toUpperCase() + feature_name.slice(1).toLowerCase()} has been updated`
            else message = err_msg ? err_msg : `${feature_name.charAt(0).toUpperCase() + feature_name.slice(1).toLowerCase()} has not been updated`
            break
        case METHOD.DELETE:
            if (status_code === 200) message = success_msg ? success_msg : `${feature_name.charAt(0).toUpperCase() + feature_name.slice(1).toLowerCase()} has been deleted`
            else message = err_msg ? err_msg : `${feature_name.charAt(0).toUpperCase() + feature_name.slice(1).toLowerCase()} has not been deleted`
            break
        default:
            if (status_code === 200) message = success_msg
            else message = err_msg
            break
    }
    _.extend(response, { message })
    if (data) _.extend(response, { data, total })
    return response
}

/**
 * Documentation of generate joi response function:
 *
 * method     - must either be 'create', 'read', 'update' or 'delete'
 *
 * has_custom_labels - true or false. checks if the api has custom labels in the schema.
 *                     To use custom labels for each fields check joi's documentation from the website.
 *                      (https://joi.dev/api/?v=17.13.3#anylabelname)
 *
 **/
const generate_joi_response = (method, has_custom_labels) => {
    if (method && (method === METHOD.READ || method === METHOD.DELETE)) {
        let messages = {
            "string.base": `Invalid query parameters provided.`,
            "string.empty": `Invalid query parameters provided.`,
            "string.min": `Query parameter is less than {#limit} characters.`,
            "string.max": `Query parameter is more than {#limit} characters.`,
            "number.base": `Invalid query parameters provided.`,
            "number.integer": `Please enter valid integer.`,
            "number.min": `Query parameter is less than {#limit}.`,
            "number.max": `Query parameter is more than {#limit}.`,
            "date.base": `Invalid query parameters provided.`,
            "date.min": `Query parameter is less than {#limit}.`,
            "date.max": `Query parameter is more than {#limit}.`,
            "boolean.base": `Invalid query parameters provided.`,
            "array.base": `Invalid query parameters provided.`,
            "array.min": `Query parameter is less than {#limit}.`,
            "array.max": `Query parameter is more than {#limit}.`,
            "object.base": `Invalid query parameters provided.`,
            "any.required": `Invalid query parameters provided.`
        }
        if (has_custom_labels) {
            Object.keys(messages).forEach(item => {
                messages[item] = messages[item] + " - {#label}"
            })
            return messages
        } else {
            return messages
        }
    } else {
        let messages = {
            "string.base": `Please fill out required field.`,
            "string.empty": `Please fill out required field.`,
            "string.min": `Please enter no more than {#limit} characters.`,
            "string.max": `Please enter at least {#limit} characters.`,
            "number.base": `Please fill out required field.`,
            "number.integer": `Please enter valid integer.`,
            "number.min": `Please enter value no more than {#limit}.`,
            "number.max": `Please enter value less than {#limit}.`,
            "date.base": `Please fill out required field.`,
            "date.min": `Please enter value no more than {#limit}.`,
            "date.max": `Please enter value less than {#limit}.`,
            "boolean.base": `Please fill out required field.`,
            "array.base": `Please fill out required field.`,
            "array.min": `Form less than {#limit} are not allowed.`,
            "array.max": `Form no more than {#limit} are not allowed.`,
            "object.base": `Please fill out required field.`,
            "any.required": `Please fill out required field.`
        }
        if (has_custom_labels) {
            Object.keys(messages).forEach(item => {
                messages[item] = messages[item] + " - {#label}"
            })
            return messages
        } else {
            return messages
        }
    }
}

const is_granted = async (request, api) => {
    let token = request.headers.authorization.split(" ")[1]
    let access_api = await Dao.get_value(request.redis_tdb, token)
    access_api = JSON.parse(access_api)
    return access_api.includes(api)
}

const get_query_path = (fileDerectory, routeFileName) => {
    if (!fileDerectory) {
        throw new Error("File directory is not provided.")
    }
    const dbType = process.env.DB_TYPE
    if (!dbType) {
        throw new Error("DB_TYPE environment variable is not set.")
    }
    const builderPath = path.join(fileDerectory, `${routeFileName.replace("_api", "_")}${dbType}.js`)
    try {
        const QueryBuilder = require(builderPath)
        return new QueryBuilder()
    } catch (error) {
        throw new Error(`Failed to load SQL builder for DB_TYPE "${dbType}": ${error.message}`)
    }
}

const get_path_builder = fileDerectory => {
    if (!fileDerectory) {
        throw new Error("File directory is not provided.")
    }
    const dbType = process.env.DB_TYPE
    if (!dbType) {
        throw new Error("DB_TYPE environment variable is not set.")
    }
    const builderPath = path.join(fileDerectory, `${dbType}.js`)
    try {
        const QueryBuilder = require(builderPath)
        return new QueryBuilder()
    } catch (error) {
        throw new Error(`Failed to load SQL builder for DB_TYPE "${dbType}": ${error.message}`)
    }
}

const get_current_time = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentDate = new Date()
    const month = months[currentDate.getMonth()]
    const day = currentDate.getDate()
    let hours = currentDate.getHours()
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12
    hours = hours ? hours : 12 // Handle midnight (0 hours)
    const minutes = currentDate.getMinutes()
    const seconds = currentDate.getSeconds()
    return `${month} ${day} ${hours}:${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds} ${ampm}`
}

const convert_keys_to_lower_case = object_list => {
    return object_list.map(obj => {
        const new_obj = {}
        for (const key in obj) {
            new_obj[key.toLowerCase()] = obj[key]
        }
        return new_obj
    })
}

// const get_mfi_schema_name = async request => {
//     let mfi_schema_name = null
//     if (request.db_type === RDBMS.POSTGRES) {
//         mfi_schema_name = await get_postgres_mfi_schema_name(request)
//     } else if (request.db_type === RDBMS.ORACLE) {
//         mfi_schema_name = await get_oracle_mfi_schema_name(request)
//     }
//     return mfi_schema_name
// }

// const get_oracle_mfi_schema_name = async request => {
//     let data = null
//     let sql = {
//         text: `SELECT ins.db_schema_name || '.' AS "db_schema_name"
//                FROM ${SCHEMA.COMMON}${TABLE.INSTITUTE} ins
//                WHERE ins.oid = :1 OR ins.institute_id = :2`,
//         values: [request.payload.mfi_oid, request.payload.mfi_id]
//     }
//     try {
//         let data_set = await Dao.get_data(request, sql)
//         console.log(data_set[0])
//         data = data_set[0] ?? null
//     } catch (e) {
//         log.error(`An exception occurred while getting mfi-schema name : ${e?.message}`)
//         throw e
//     }
//     return data
// }

// const get_postgres_mfi_schema_name = async request => {
//     let data = null
//     let sql = {
//         text: `select concat(ins.db_schema_name,'.') as "db_schema_name"
//             from ${SCHEMA.COMMON}${TABLE.INSTITUTE} ins
//             where 1 = 1 and ins.oid = $1 or ins.institute_id = $2`,
//         values: [request.payload.mfi_oid, request.payload.mfi_id]
//     }
//     try {
//         let data_set = await Dao.get_data(request, sql)
//         console.log(data_set[0])
//         data = data_set[0] ?? null
//     } catch (e) {
//         log.error(`An exception occurred while getting mfi-schema name : ${e?.message}`)
//         throw e
//     }
//     return data
// }

// const get_mfi_management_process_data = async request => {
//     let mfi_management_process_data = null
//     if (request.db_type === RDBMS.POSTGRES) {
//         mfi_management_process_data = await get_postgres_mfi_management_process_data(request)
//     } else if (request.db_type === RDBMS.ORACLE) {
//         mfi_management_process_data = await get_oracle_mfi_management_process_data(request)
//     }
//     console.log("mfi_management_process_data", mfi_management_process_data)
//     return mfi_management_process_data
// }

// const get_postgres_mfi_management_process_data = async request => {
//     let data = null
//     try {
//         let schemaName
//         console.log(request.auth.credentials.mfi_schema)
//         if (request.auth.credentials.mfi_schema) {
//             schemaName = request.auth.credentials.mfi_schema
//         } else if (request.payload.mfi_schema) {
//             schemaName = request.payload.mfi_schema
//         } else {
//             schemaName = await this.get_postgres_mfi_schema_name(request)
//         }
//         if (!schemaName) {
//             throw new Error("No schema found for the provided OID or Institute ID")
//         }
//         if (!request.payload.office_id) {
//             throw new Error("No office_id found in payload to get MFI management process data")
//         }
//         const sql = {
//             text: `
//                 SELECT TO_CHAR(business_date, 'YYYY-MM-DD') AS business_date, management_process_id
//                 FROM (
//                     SELECT business_date, management_process_id,
//                            ROW_NUMBER() OVER (PARTITION BY office_id ORDER BY business_date DESC) AS rn
//                     FROM ${schemaName}${TABLE.MANAGEMENT_PROCESS_TRACKER}
//                     WHERE office_id = $1
//                 )
//                 WHERE rn = 1`,
//             values: [request.payload.office_id]
//         }
//         const data_set = await Dao.get_data(request, sql)
//         data = data_set[0] ?? null
//         if (!data) {
//             throw new Error("No management process data found for the provided office_id")
//         }
//         return data
//     } catch (e) {
//         log.error(`An exception occurred: ${e?.message}`)
//         throw e
//     }
// }

// const get_oracle_mfi_management_process_data = async request => {
//     let data = null
//     try {
//         let schemaName
//         if (request.auth.credentials.mfi_schema) {
//             schemaName = request.auth.credentials.mfi_schema
//         } else if (request.payload.mfi_schema) {
//             schemaName = request.payload.mfi_schema
//         } else {
//             schemaName = await this.get_oracle_mfi_schema_name(request)
//         }
//         if (!schemaName) {
//             throw new Error("No schema found for the provided OID or Institute ID")
//         }
//         if (!request.payload.office_id) {
//             throw new Error("No office_id found in payload to get MFI management process data")
//         }
//         const sql = {
//             text: `
//                 SELECT TO_CHAR(business_date, 'YYYY-MM-DD') AS business_date, management_process_id 
//                 FROM (
//                     SELECT business_date, management_process_id,
//                            ROW_NUMBER() OVER (PARTITION BY office_id ORDER BY business_date DESC) AS rn
//                     FROM ${schemaName}${TABLE.MANAGEMENT_PROCESS_TRACKER}
//                     WHERE office_id = :office_id
//                 )
//                 WHERE rn = 1`,
//             values: [request.payload.office_id]
//         }
//         const data_set = await Dao.get_data(request, sql)
//         data = data_set[0] ?? null
//         if (!data) {
//             throw new Error("No management process data found for the provided office_id")
//         }
//         return data
//     } catch (e) {
//         log.error(`An exception occurred: ${e?.message}`)
//         throw e
//     }
// }

const get_data_with_count = async data => {
    const totalCount = data[0]?.total_count || 0 // Extract total_count from the first row
    const transformedData = data.map(({ total_count, ...rest }) => rest) // Remove total_count from each row

    return { total: totalCount, data: transformedData }
}
const generate_id_format = async (count, digits) => {
    count += 1
    return count.toString().padStart(digits, "0")
}

module.exports = {
    generateRandomString,
    generate_response,
    generate_error_response,
    generate_joi_response,
    is_null_or_empty,
    is_granted,
    get_path_builder,
    get_query_path,
    get_current_time,
    convert_keys_to_lower_case,
    get_data_with_count,
    generate_id_format
}
