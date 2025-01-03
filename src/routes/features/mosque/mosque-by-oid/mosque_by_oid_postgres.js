"use strict";
const log = require("../../../../util/log");
const Dao = require("../../../../util/dao");
const { convert_keys_to_lower_case } = require("../../../../util/helper");
const { TABLE, SCHEMA } = require("../../../../util/constant");

class query_builder {
    get_single_mosque = async request => {
        let query = `SELECT oid, name, location, created_by,created_on
                     FROM ${SCHEMA.TEMPLATE}${TABLE.MOSQUE}
                     WHERE oid = $1`;

        let sql = {
            text: query,
            values: [request.payload.oid]
        };

        try {
            let data_set = await Dao.get_data(request, sql);
            return data_set.length !== 1 ? null : convert_keys_to_lower_case(data_set)[0];
        } catch (e) {
            log.error(`An exception occurred while getting single mosque: ${e.message}`);
            throw e;
        }
    };
}
module.exports = query_builder;
