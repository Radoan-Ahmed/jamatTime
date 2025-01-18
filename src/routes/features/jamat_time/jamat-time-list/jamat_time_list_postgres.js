"use strict"
const log = require("../../../../util/log")
const Dao = require("../../../../util/dao")
const { TABLE, SCHEMA } = require("../../../../util/constant")
const { is_null_or_empty, get_data_with_count } = require("../../../../util/helper")
class query_builder {
    get_data = async request => {
        let payload = request.payload
        let data = []
        let idx = 1
        const params = []
        let query = `SELECT count(j.oid) over () AS total_count, j.oid, j.prayer_name,  TO_CHAR(j.jamat_time, 'HH12:MI AM') as jamat_time, m.name as mosque_name, m.location
            FROM ${SCHEMA.TEMPLATE}${TABLE.JAMAT_TIMES} j
            JOIN ${SCHEMA.TEMPLATE}${TABLE.MOSQUE} m ON m.oid = j.oid
            WHERE 1 = 1`

        if (payload.mosque_name) {
            query += ` AND name = $${idx++}`;
            params.push(payload.mosque_name);
        }
        if (payload.location) {
            query += ` AND lower(trim(location)) = $${idx++}`;
            params.push(payload.location.trim().toLowerCase());
        }

        if (payload.search_text) {
            query += ` and (m.name ilike $${idx}
                            or m.location ilike $${idx}
                            or j.prayer_name ilike $${idx}
                            or j.oid::text ilike $${idx}
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
            log.error(`An exception occurred while getting jamat time list: ${e.message}`)
            throw e
        }
    }

}

module.exports = query_builder
