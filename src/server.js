"use strict"

const log = require("./util/log")
const Hapi = require("@hapi/hapi")
const Helper = require("./util/helper")
const moment = require("moment-timezone")
const Constant = require("./util/constant")
const { initialize_database } = require("./util/dao")
const Path = require("path")
const { clearConfigCache } = require("prettier")

require("dotenv").config({ path: `./src/env/.env.${process.env.NODE_ENV}` })

const db_type = process.env.DB_TYPE

const start_server = async () => {
    let pool
    const server = Hapi.server({
        port: process.env.APP_PORT || 3000,
        host: process.env.APP_HOST || "localhost",
        routes: {
            cors: {
                origin: ["*"]
            }
        }
    })


    await server.register({
        plugin: require("hapi-authorization"),
        options: {
            roles: false
        }
    })

    await server.register({
        plugin: require("hapi-auto-route"),
        options: {
            routes_dir: Path.join(__dirname, "routes")
        }
    })

    await server.register({
        plugin: require("blipp"),
        options: {
            showAuth: true
        }
    })

    await server.register({
        plugin: require("hapi-alive"),
        options: {
            path: Constant.API.CONTEXT + Constant.API.HEALTH_CHECK,
            responses: {
                healthy: {
                    message: "Application is running..."
                }
            }
        }
    })

    await server.register({
        plugin: require("hapijs-status-monitor"),
        options: {
            title: "Status",
            path: Constant.API.CONTEXT + Constant.API.STATUS,
            routeConfig: {
                auth: false
            }
        }
    })

    server.ext("onRequest", async function (request, h) {
        request.headers["request-time"] = moment().tz("Asia/Dhaka").valueOf()
        log.setTraceId(Helper.generateRandomString(12))
        request.pool = pool
        request.db_type = db_type
        return h.continue
    })

    server.events.on("start", async () => {
        if ((await Helper.is_null_or_empty(db_type)) || (db_type != Constant.RDBMS.ORACLE && db_type != Constant.RDBMS.POSTGRES)) {
            throw new Error(`Unsupported DB_TYPE : ${db_type}`)
        }
        pool = await initialize_database(db_type)
        log.info(`Hapi js(${server.version}) running on ${server.info.uri}`)
    })

    await server.start()
}

process.on("unhandledRejection", err => {
    console.log(err)
    process.exit(1)
})

start_server()
