"use strict";
const log = require("../../../../util/log");
const Dao = require("../../../../util/dao");
const { TABLE, SCHEMA, STATUS } = require("../../../../util/constant");
const { convert_keys_to_lower_case } = require("../../../../util/helper");
const { constant } = require("underscore");

class query_builder {
    get_data = async request => {
        let payload = request.payload;
        let data = [];
        let params = [];
        let query = `SELECT e.oid, e.employee_id, company_employee_id, emp_name_en as label_en, emp_name_bn as label_bn FROM ${request.auth.credentials.mfi_schema}${TABLE.EMPLOYEE} e
        JOIN ${request.auth.credentials.mfi_schema}${TABLE.EMP_OFFICE_MAP} eom  ON eom.EMPLOYEE_ID = e.EMPLOYEE_ID 
        WHERE 1 = 1`

        let idx = 1;

        if (payload.status) {
            query += ` AND e.status = :${idx++}`;
            params.push(payload.status);
        }

        if (payload.office_id) {
            query += ` AND eom.office_id = :${idx++}`;
            params.push(payload.office_id);
        }

        if (payload.samity_id) {
            query += ` AND eom.samity_id = :${idx++}`;
            params.push(payload.samity_id);
        }

        query += ` ORDER BY e.created_on ASC`;

        let sql = {
            text: query,
            values: params
        };

        try {
            data = await Dao.get_data(request, sql);
        } catch (e) {
            log.error(`An exception occurred while getting mfi employee list for dropdown: ${e.message}`);
            throw e;
        }

        return convert_keys_to_lower_case(data);
    };
}

module.exports = query_builder;
