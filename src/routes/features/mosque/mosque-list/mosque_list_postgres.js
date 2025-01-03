"use strict"
const log = require("../../../../util/log")
const Dao = require("../../../../util/dao")
const { TABLE, SCHEMA } = require("../../../../util/constant")
const { is_null_or_empty , get_data_with_count} = require("../../../../util/helper")
class query_builder {
    get_data = async request => {
        let payload = request.payload
        let data = []
        let idx = 1
        const params = []
        let query = `SELECT count(oid) over () AS total_count, oid, name,location,created_by, created_on
            FROM ${SCHEMA.TEMPLATE}${TABLE.MOSQUE} m
            WHERE 1 = 1`

        if (payload.search_text) {
            query += ` and (name ilike $${idx}
                            or location ilike $${idx}
                            )`
            idx++
            params.push("%" + payload.search_text.trim() + "%")
        }

        if (payload.sort_column && payload.sort_order) {
            query += ` ORDER BY ${payload.sort_column} ${payload.sort_order}`
        } else {
            query += ` ORDER BY oid DESC`
        }
        if (!(await is_null_or_empty(payload.offset))) {
            query += ` OFFSET ${payload.offset}`
        }
        if (payload.limit) {
            query += ` LIMIT ${payload.limit}`
        }

        const sql = {
            text: query,
            values: params
        }
        try {
            let result = await Dao.get_data(request, sql)
            data = result
            return get_data_with_count(data)
        } catch (e) {
            log.error(`An exception occurred while getting mosque list: ${e.message}`)
            throw e
        }
    }

}

module.exports = query_builder
