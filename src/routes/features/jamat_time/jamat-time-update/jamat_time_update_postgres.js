"use strict"
const log = require("../../../../util/log")
const Dao = require("../../../../util/dao")
const { TABLE, SCHEMA } = require("../../../../util/constant")

class query_builder {
    update_mosque = async request => {
        let payload = request.payload
        const sql = {
            text: `update ${SCHEMA.TEMPLATE}${TABLE.JAMAT_TIMES} set prayer_name = $1, jamat_time = $2 where jamat_time_id = $3`,
            values: [payload.prayer_name, payload.jamat_time, payload.jamat_time_id]
        }
        try {
            await Dao.execute_value(request, sql)
            return true
        } catch (e) {
            log.error(`An exception occurred while updating jamat time : ${e?.message}`)
            throw e
        }
    }
}

module.exports = query_builder
