"use strict"

const pg = require("pg")
const log = require("./log")
const Constant = require("./constant")
const oracledb = require("oracledb")

require("dotenv").config({ path: `./src/env/.env.${process.env.NODE_ENV}` })

const initialize_postgres_pool = () => {
    const pool = new pg.Pool({
        user: process.env.PG_USER,
        host: process.env.PG_HOST,
        database: process.env.PG_NAME,
        password: process.env.PG_PASSWORD,
        port: process.env.PG_PORT,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
    })
    return pool
}

const initialize_oracle_pool = async () => {
    const connect_string = `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE}`
    oracledb.initOracleClient()
    const pool = oracledb.createPool({
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASSWORD,
        connectString: connect_string,
        poolAlias: "ims-pool",
        poolMin: 20,
        poolMax: 50,
        poolIncrement: 5,
        poolTimeout: 300,
        stmtCacheSize: 50,
        fetchArraySize: 100,
        queueTimeout: 60000
    })
    return pool
}

// const initialize_redis = (db) => {
//     const redis_client = Redis.createClient({
//         host: process.env.REDIS_HOST,
//         port: process.env.REDIS_PORT,
//         db: db,
//         password: process.env.REDIS_PASSWORD,
//     })
//     return redis_client
// }

const is_connected = async (db_type, pool) => {
    const client = await get_connection(db_type, pool)
    if (db_type.toLowerCase() === Constant.RDBMS.POSTGRES) {
        await client.query("SELECT 1")
        await client.release()
        log.info("Postgres connected")
    } else if (db_type.toLowerCase() === Constant.RDBMS.ORACLE) {
        await client.execute("SELECT sysdate FROM dual", [], {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        })
        await client.close()
        log.info("Oracle connected")
    }
    return pool
}

const initialize_database = async db_type => {
    let pool
    if (db_type.toLowerCase() === Constant.RDBMS.POSTGRES) {
        pool = await initialize_postgres_pool()
    } else if (db_type.toLowerCase() === Constant.RDBMS.ORACLE) {
        pool = await initialize_oracle_pool()
    }
    return await is_connected(db_type, pool)
}

const close = async (db_type, connection) => {
    if (db_type.toLowerCase() === Constant.RDBMS.POSTGRES) {
        await connection.release()
    } else if (db_type.toLowerCase() === Constant.RDBMS.ORACLE) {
        await connection.close()
    }
}

const get_connection = async (db_type, pool) => {
    if (db_type.toLowerCase() === Constant.RDBMS.POSTGRES) {
        return await pool.connect()
    } else if (db_type.toLowerCase() === Constant.RDBMS.ORACLE) {
        return await pool.getConnection()
    }
}

const get_data = async (request, query) => {
    const connection = await get_connection(request.db_type, request.pool)
    let result
    try {
        if (request.db_type.toLowerCase() === Constant.RDBMS.POSTGRES) {
            result = await connection.query(query.text, query.values || [])
        } else if (request.db_type.toLowerCase() === Constant.RDBMS.ORACLE) {
            result = await connection.execute(query.text, query.values || [], {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            })
        }
        return result.rows
    } catch (err) {
        log.error("Unable to execute statement in database : ", err)
        throw err
    } finally {
        close(request.db_type, connection)
    }
}

const get_data_string = async (request, query) => {
    const client = await get_connection(request.db_type, request.pool)
    let result
    try {
        if (request.db_type.toLowerCase() === Constant.RDBMS.POSTGRES) {
            result = await client.query(query.text, query.values || [])
        } else if (request.db_type.toLowerCase() === Constant.RDBMS.ORACLE) {
            // oracledb.fetchAsString = [oracledb.CLOB];

            result = await client.execute(query.text, query.values || [], {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            })
        }
        return result.rows
    } catch (err) {
        log.error("Unable to execute statement in database : ", err)
        throw err
    } finally {
        close(request.db_type, client)
    }
}

// General execution for single value based on DB_TYPE
const execute_value = async (request, query) => {
    if (request.db_type === Constant.RDBMS.ORACLE) {
        return await execute_value_oracle(request, query)
    } else if (request.db_type === Constant.RDBMS.POSTGRES) {
        return await execute_value_postgres(request, query)
    } else {
        throw new Error("Unsupported database type")
    }
}

// Oracle: Execute single statement
const execute_value_oracle = async (request, query) => {
    const connection = await get_connection(request.db_type, request.pool)
    try {
        await connection.execute(query.text, query.values || [])
        await connection.commit()
    } catch (error) {
        log.error("Failed to execute Oracle statement:", { query, error })
        throw error
    } finally {
        if (connection) {
            try {
                await connection.close()
            } catch (release_error) {
                log.error("Error releasing Oracle connection:", release_error)
            }
        }
    }
}

// PostgreSQL: Execute single statement
const execute_value_postgres = async (request, query) => {
    const connection = await get_connection(request.db_type, request.pool)
    try {
        await connection.query(query.text, query.values || [])
    } catch (error) {
        log.error("Failed to execute PostgreSQL statement:", { query, error })
        throw error
    } finally {
        connection.release()
    }
}

// General execution for multiple values based on DB_TYPE
const execute_values = async (request, queries) => {
    if (request.db_type === Constant.RDBMS.ORACLE) {
        return await execute_values_oracle(request, queries)
    } else if (request.db_type === Constant.RDBMS.POSTGRES) {
        return await execute_values_postgres(request, queries)
    } else {
        throw new Error("Unsupported database type")
    }
}

// Oracle: Execute multiple statements
const execute_values_oracle = async (request, queries) => {
    const connection = await get_connection(request.db_type, request.pool)
    try {
        for (let query of queries) {
            await connection.execute(query.text, query.values || [])
        }
        await connection.commit()
    } catch (error) {
        log.error("Failed to execute multiple Oracle statements:", { queries, error })
        throw error
    } finally {
        if (connection) {
            try {
                await connection.close()
            } catch (release_error) {
                log.error("Error releasing Oracle connection:", release_error)
            }
        }
    }
}

// PostgreSQL: Execute multiple statements
const execute_values_postgres = async (request, queries) => {
    const connection = await get_connection(request.db_type, request.pool)
    try {
        await connection.query("BEGIN")
        for (let query of queries) {
            await connection.query(query.text, query.values || [])
        }
        await connection.query("COMMIT")
    } catch (error) {
        await connection.query("ROLLBACK")
        log.error("Failed to execute multiple PostgreSQL statements:", { queries, error })
        throw error
    } finally {
        connection.release()
    }
}

const execute_func = async (request, query) => {
    const connection = await get_connection(request.db_type, request.pool);
    let clob;

    try {
        clob = await connection.createLob(oracledb.CLOB);
        clob.write(JSON.stringify(query.values[0]));

        const result = await connection.execute(
            query.text,
            {
                param: { val: clob, type: oracledb.CLOB },
                result: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 32767 }
            },
            { autoCommit: true }
        );
        return result.outBinds.result;
    } catch (error) {
        log.error("Unable to execute statement in database:", { query, error });
        throw error;
    } finally {
        if (clob) {
            try {
                clob.close();
            } catch (error) {
                log.error("Error closing CLOB:", error);
            }
        }
        if (connection) {
            try {
                await connection.close();
            } catch (error) {
                log.error("Error closing OracleDB connection:", error);
            }
        }
    }
};

module.exports = {
    initialize_database,
    get_data,
    get_data_string,
    execute_value,
    execute_values,
    execute_func
}
