"use strict"

const Joi = require("joi")
const path = require("path")
const log = require("../../../../util/log")
const { API, METHOD } = require("../../../../util/constant")
const Helper = require("../../../../util/helper")
const route_filename = path.basename(__filename, ".js")

const request_payload = Joi.object({
    name: Joi.string().trim().allow(null, "").optional(),
    location: Joi.string().trim().allow(null, "").optional(),
    oid: Joi.number().allow(null, "").optional()
})

const route_controller = {
    method: "POST",
    path: API.CONTEXT + API.LOCATION_DROPDOWN_LIST,
    config: {
        description: "Location Dropdown List",
        plugins: { hapiAuthorization: false },
        validate: {
            payload: request_payload,
            options: {
                allowUnknown: false
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 400, status: false, message: err.message }).takeover()
            }
        },
        ext: {
            onPreHandler: {
                method: async (request, h) => {
                    if (request.payload) {
                        log.debug("Checking payload:", JSON.stringify(request.payload));
                    } else {
                        log.debug("No payload found in the request for location dropdown.");
                    }
                    return h.continue;
                }
            }
        }
    },
    handler: async (request, h) => {
        log.debug(`Request received for location dropdown list - ${JSON.stringify(request.payload)}`)
        const response = await handle_request(request)
        log.debug(`Response sent - ${JSON.stringify(response)}`)
        return h.response(response)
    }
}

const handle_request = async request => {
    let data = await Helper.get_query_path(__dirname, route_filename).get_data(request)
    log.info(`[${data.length}] location information found for dropdown`)
    let response = Helper.generate_response({ method: METHOD.READ, feature_name: "location", status_code: 200, data })
    return response
}

module.exports = route_controller
