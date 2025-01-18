"use strict";
const log = require("../../../../util/log");
const Dao = require("../../../../util/dao");
const { TABLE, SCHEMA } = require("../../../../util/constant");
const { template } = require("underscore");

class query_builder {
    get_data = async request => {
        let payload = request.payload;
        let data = [];
        let params = [];
        let query = `SELECT m.name, m.oid, m.location FROM ${SCHEMA.TEMPLATE}${TABLE.MOSQUE} m
        WHERE 1 = 1`

        let idx = 1;

        if (payload.name) {
            query += ` AND lower(trim(m.name)) = $${idx++}`;
            params.push(payload.name.trim().toLowerCase());
        }
        if (payload.location) {
            query += ` AND lower(trim(location)) = $${idx++}`;
            params.push(payload.location.trim().toLowerCase());
        }
        if (payload.oid) {
            query += ` AND oid = $${idx++}`;
            params.push(payload.oid);
        }

        console.log("Query: ", query);

        let sql = {
            text: query,
            values: params
        };

        console.log("SQL: ", sql);

        try {
            data = await Dao.get_data(request, sql);
        } catch (e) {
            log.error(`An exception occurred while getting location list for dropdown: ${e.message}`);
            throw e;
        }

        return data;
    };
}

module.exports = query_builder;
