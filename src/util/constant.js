"use strict"

module.exports = {
    RDBMS: {
        // ORACLE: "oracle",
        POSTGRES: "postgres"
    },
    TEXT: {
        ALGORITHM: "HS256",
        BEARER: "Bearer",
        SENT_OTP: "SentOtp",
        FAILED_OTP: "FailedOtp",
        ACTIVE: "Active"
    },
    USER_TYPE: {
        MRA: "MRA",
        MFI: "MFI",
        SUPPORT: "SUPPORT"
    },
    STATUS: {
        ACTIVE: "Active",
        ALL: "All"
    },
    METHOD: {
        CREATE: "create",
        READ: "read",
        UPDATE: "update",
        DELETE: "delete",
        DUPLICATE: "delete"
    },
    SCHEMA: {
        COMMON: "COMMON.",
        TEMPLATE: "TEMPLETE."
    },
    TABLE: {
        MOSQUE: "mosques",
    },
    IMAGE_FILE_UPLOAD_TYPE: ["photo", "report"],
    APP_FILE_UPLOAD_TYPE: ["apk"],
    API: {
        CONTEXT: "/jamatapp/api",
        STATUS: "/monitor/status",
        HEALTH_CHECK: "/monitor/health-check",
        V1_GET_MODULE_TREE: "/v1/admin/get-module-tree",
        V1_GET_MODULE_LIST: "/v1/admin/get-module-list",
        V1_GET_SUBMODULE_LIST: "/v1/admin/get-submodule-list",
        V1_GET_TABLE_CONFIG: "/v1/common/table/get-config/{table_id}",

        // mosque
        CREATE_MOSQUE: "/v1/features/mosque/create-mosque-list",
        UPDATE_SINGLE_MOSQUE: "/v1/features/mosque/update-single-mosque",
        GET_SINGLE_MOSQUE_LIST: "/v1/features/mosque/single-mosque-list",
        MOSQUE_LIST: "/v1/features/mosque/mosque-list",
        MOSQUE_DROPDOWN_LIST: "/v1/features/mosque/mosque-dropdown-list",

    },
    MESSAGE: {
        SUCCESS_GET_LIST: "Successfully found list",
        SUCCESS_GET_BY_OID: "Successfully found item",
        INTERNAL_SERVER_ERROR: "Something bad happened. Please try again later!"
    }
}
