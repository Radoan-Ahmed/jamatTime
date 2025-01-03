"use strict";
const Dao = require("../../../../util/dao");
const { TABLE, SCHEMA } = require("../../../../util/constant");
const log = require("../../../../util/log")


class query_builder {
    save_division = async (request, oid) => {
        let result = false;
        let payload = request.payload
        let sql = {
            text: `insert into ${SCHEMA.TEMPLATE}${TABLE.MOSQUE} (oid, name, location, created_by, created_on) values ($1, $2, $3, $4, $5)`,
            values: [oid, payload.name, payload.location,"system", new Date()]
        };

        try {
            await Dao.execute_value(request, sql);
            result = true;
        } catch (e) {
            log.error(`An exception occurred while creating mosque : ${e?.message}`);
        }
        return result;
    };

    count_mosque = async request => {
        const sql = {
            text: `select count(oid) as "total" from ${SCHEMA.TEMPLATE}${TABLE.MOSQUE} where 1 = 1`,
            values: []
        }
        try {
            let data_set = await Dao.get_data(request, sql)
            return data_set[0]["total"]
        } catch (e) {
            log.error(`An exception occurred while creating mosque : ${e?.message}`)
            throw e
        }
    }
}

module.exports = query_builder;
