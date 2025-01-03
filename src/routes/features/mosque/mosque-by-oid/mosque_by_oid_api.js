"use strict";

const Joi = require("joi");
const path = require("path");
const log = require("../../../../util/log");
const { API, METHOD } = require("../../../../util/constant");
const Helper = require("../../../../util/helper");
const route_filename = path.basename(__filename, ".js");

const request_payload = Joi.object({
    oid: Joi.string().trim().min(1).max(128).required()
});

const route_controller = {
    method: "POST",
    path: API.CONTEXT + API.GET_SINGLE_MOSQUE_LIST,
    config: {
        description: "Mosque By Oid",
        plugins: { hapiAuthorization: false },
        validate: {
            payload: request_payload,
            options: {
                allowUnknown: false
            },
            failAction: async (request, h, err) => {
                return h.response({ code: 400, status: false, message: err?.message }).takeover();
            }
        }
    },
    handler: async (request, h) => {
        log.debug(`Request received for single mosque ${JSON.stringify(request.payload)}`);
        const response = await handle_request(request);
        log.debug(`Response sent for single mosque- ${JSON.stringify(response)}`);
        return h.response(response);
    }
};

const handle_request = async request => {
    let data = await Helper.get_query_path(__dirname, route_filename).get_single_mosque(request);
    if (data == null) {
        log.warn(`mosque detail not found for oid: [${request.payload.oid}]`);
        return generate_response({ method: METHOD.READ, feature_name: "mosque", status_code: 204 });
    }
    log.info(`mosque information found by oid: [${request.payload.oid}]`);
    return Helper.generate_response({ method: METHOD.READ, feature_name: "mosque", status_code: 200, data });
};

module.exports = route_controller;
