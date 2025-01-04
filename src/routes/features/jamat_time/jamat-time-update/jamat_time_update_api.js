"use strict"

const Joi = require("joi")
const path = require("path")
const uuid = require("uuid")
const log = require("../../../../util/log")
const { API, METHOD } = require("../../../../util/constant")
const Helper = require("../../../../util/helper")
const route_filename = path.basename(__filename, ".js")

const request_payload = Joi.object({
    jamat_time_id : Joi.string().trim().min(1).max(128).required(),
    oid: Joi.string().trim().min(1).max(128).optional(),
    prayer_name: Joi.string().trim().min(2).max(128).required(),
    jamat_time: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/).required()
})

const route_controller = {
    method: "POST",
    path: API.CONTEXT + API.UPDATE_SINGLE_JAMAT_TIME,
    config: {
        description: "jamat time Update",
        plugins: { hapiAuthorization: false },
        validate: {
            payload: request_payload,
            options: {
                allowUnknown: false
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 400, status: false, message: err?.message }).takeover()
            }
        }
    },
    handler: async (request, h) => {
        log.debug(`Request received for jamat time update - ${JSON.stringify(request.query)}`)
        const response = await handle_request(request)
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response)
    }
}

const handle_request = async request => {
    let result = await Helper.get_query_path(__dirname, route_filename).update_mosque(request)
    if (!result) {
        log.warn(`Response returned with code: '504'`)
        return Helper.generate_response({ method: METHOD.UPDATE, feature_name: "jamat time", status_code: 504 })
    }
    let response = Helper.generate_response({ method: METHOD.UPDATE, feature_name: "jamat time", status_code: 200 })
    response.oid = request.payload.oid
    log.info(`jamat time updated successfully by for oid: [${request.payload.oid}]`)
    return response
}

module.exports = route_controller
