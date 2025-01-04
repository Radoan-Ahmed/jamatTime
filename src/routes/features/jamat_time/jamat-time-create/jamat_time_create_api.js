"use strict"
const Joi = require("joi")
const path = require("path")
const uuid = require("uuid")
const log = require("../../../../util/log")
const { API, METHOD } = require("../../../../util/constant")
const Helper = require("../../../../util/helper")
const route_filename = path.basename(__filename, ".js")

const request_payload = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required(),
    prayer_name: Joi.string().trim().min(2).max(128).required(),
    jamat_time: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/).required()
})

const route_controller = {
    method: "POST",
    path: API.CONTEXT + API.CREATE_JAMAT_TIME,
    config: {
        description: "Jamat time Create",
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
        log.debug(`Request received for jamat time create - ${JSON.stringify(request.payload)}`)
        const response = await handle_request(request)
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response)
    }
}

const handle_request = async request => {
    const jamat_time_id = uuid.v4()
    let result = await Helper.get_query_path(__dirname, route_filename).save_jamat_time(request, jamat_time_id)
    if (!result) {
        log.warn(`Response returned with code: '504'`)
        return Helper.generate_response({ method: METHOD.CREATE, feature_name: "jamat time", status_code: 504 })
    }
    let response = Helper.generate_response({ method: METHOD.CREATE, feature_name: "jamat time", status_code: 200 })
    log.info(`jamat time created successfully by`)
    return response
}

module.exports = route_controller
