"use strict";
const Dao = require("../../../../util/dao");
const { TABLE, SCHEMA } = require("../../../../util/constant");
const log = require("../../../../util/log")


class query_builder {
    save_jamat_time = async (request, jamat_time_id) => {
        let result = false;
        let payload = request.payload
        let sql = {
            text: `insert into ${SCHEMA.TEMPLATE}${TABLE.JAMAT_TIMES} (oid, prayer_name, jamat_time,jamat_time_id) values ($1, $2, $3,$4)`,
            values: [payload.oid, payload.prayer_name, payload.jamat_time,jamat_time_id]
        };

        try {
            await Dao.execute_value(request, sql);
            result = true;
        } catch (e) {
            log.error(`An exception occurred while creating jamat time : ${e?.message}`);
        }
        return result;
    };
}

module.exports = query_builder;
