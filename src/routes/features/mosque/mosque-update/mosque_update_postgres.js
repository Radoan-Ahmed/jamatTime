"use strict"
const log = require("../../../../util/log")
const Dao = require("../../../../util/dao")
const { TABLE, SCHEMA } = require("../../../../util/constant")

class query_builder {
    update_mosque = async request => {
        let payload = request.payload
        const sql = {
            text: `update ${SCHEMA.TEMPLATE}${TABLE.MOSQUE} set name = $1, location = $2, updated_by = $3 where oid = $4`,
            values: [payload.name, payload.location,"riyad", payload.oid]
        }
        try {
            await Dao.execute_value(request, sql)
            return true
        } catch (e) {
            log.error(`An exception occurred while updating bank branch : ${e?.message}`)
            throw e
        }
    }
}

module.exports = query_builder
