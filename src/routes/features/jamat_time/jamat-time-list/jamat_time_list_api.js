"use strict"

const Joi = require("joi")
const path = require("path")
const log = require("../../../../util/log")
const { API, METHOD } = require("../../../../util/constant")
const Helper = require("../../../../util/helper")
const route_filename = path.basename(__filename, ".js")

const request_payload = Joi.object({
    offset: Joi.number().default(0).optional().allow(null, ""),
    limit: Joi.number().optional().allow(null, ""),
    search_text: Joi.string().trim().allow(null, "").optional(),
    sort_column: Joi.string().trim().allow(null, "").optional(),
    sort_order: Joi.string().trim().allow(null, "").optional(),
    location: Joi.string().trim().allow(null, "").optional(),
    mosque_name: Joi.string().trim().allow(null, "").optional(),
})

const route_controller = {
    method: "POST",
    path: API.CONTEXT + API.JAMAT_TIME_LIST,
    config: {
        description: "Jamat time list",
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
        log.debug(`Request received for jamat time list ${JSON.stringify(request.payload)}`)
        const response = await handle_request(request)
        log.debug(`Response sent for jamat time list- ${JSON.stringify(response)}`)
        return h.response(response)
    }
}

const handle_request = async request => {
    let {total, data} = await Helper.get_query_path(__dirname, route_filename).get_data(request)
    if (total === 0) {
        log.warn(`No jamat time data found`)
        return Helper.generate_response({ method: METHOD.READ, feature_name: "jamat time", status_code: 204, data: { total: total, rows: data } })
    }
    log.info(`Returning Response for - with ${data.length} jamat time items found]`)
    return Helper.generate_response({ method: METHOD.READ, feature_name: "jamat time", status_code: 200, data: { total: total, rows: data } })
}

module.exports = route_controller
