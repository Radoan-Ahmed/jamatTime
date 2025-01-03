"use strict";

const path = require("path");
const node_jasper = require("node-jasper");
require("dotenv").config({ path: `./src/env/.env.${process.env.NODE_ENV}` });

const jasper_reports_path = path.join(`${process.env.FILE_DIR}`, "/jasperreports-6.20.6");

const reports_config = {
    sample_report: {
        jasper: path.join(__dirname, "../routes/reports/resources/Sample.jasper"),
        jrxml: path.join(__dirname, "../routes/reports/resources/Sample.jrxml"),
        conn: "in_memory_json"
    }
};

let jasper = {};

/*
The following function initialization for node-jasper is temporarily commented out.
It was causing unexpected service restarts.
*/
if (process.env.NODE_ENV != "loc") {
    jasper = node_jasper({
        path: jasper_reports_path,
        reports: reports_config
    });
}

module.exports = { jasper };
