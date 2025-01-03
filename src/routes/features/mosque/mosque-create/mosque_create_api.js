"use strict"
const Joi = require("joi")
const path = require("path")
const uuid = require("uuid")
const log = require("../../../../util/log")
const { API, METHOD } = require("../../../../util/constant")
const Helper = require("../../../../util/helper")
const route_filename = path.basename(__filename, ".js")

const request_payload = Joi.object({
    name: Joi.string().trim().min(2).max(128).required(),
    location: Joi.string().trim().min(2).max(128).required(),
})

const route_controller = {
    method: "POST",
    path: API.CONTEXT + API.CREATE_MOSQUE,
    config: {
        description: "Mosque Create",
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
        log.debug(`Request received for mosque create - ${JSON.stringify(request.payload)}`)
        const response = await handle_request(request)
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response)
    }
}

const handle_request = async request => {
    const count = await Helper.get_query_path(__dirname, route_filename).count_mosque(request)
    const oid = parseInt(count, 10) + 1;
    let result = await Helper.get_query_path(__dirname, route_filename).save_division(request, oid)
    if (!result) {
        log.warn(`Response returned with code: '504'`)
        return Helper.generate_response({ method: METHOD.CREATE, feature_name: "mosque", status_code: 504 })
    }
    let response = Helper.generate_response({ method: METHOD.CREATE, feature_name: "mosque", status_code: 200 })
    response.oid = oid
    log.info(`mosque created successfully by`)
    return response
}

module.exports = route_controller
