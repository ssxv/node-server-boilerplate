import { winstonLog } from 'nodedata/logging'
var winston = require("winston");
const fs = require('fs');
var S3StreamLogger = require('s3-streamlogger').S3StreamLogger;
require('winston-daily-rotate-file');
require('winston-mongodb');
import { config as _config } from "../envConfig/envConfig";
const logDir = _config.logging.server_LogDir;
//Define Combined s3 Stream
var s3stream_combined = new S3StreamLogger({
    bucket: _config.logging.s3_bucket,
    folder: _config.logging.s3_applicationLogsFolder,
    name_format: _config.logging.s3_applicationLogsNameFormat,
    max_file_size: _config.logging.s3_max_file_size,
    access_key_id: _config.logging.s3_access_key_id,
    rotate_every: _config.logging.s3RotateEvery,
    secret_access_key: _config.logging.s3_secret_access_key
});

// Define Error s3 stream
var s3stream_error = new S3StreamLogger({
    bucket: _config.logging.s3_bucket,
    folder: _config.logging.s3_errorLogsFolder,
    name_format: _config.logging.s3_errorLogsNameFormat,
    max_file_size: _config.logging.s3_max_file_size,
    access_key_id: _config.logging.s3_access_key_id,
    rotate_every: _config.logging.s3RotateEvery,
    secret_access_key: _config.logging.s3_secret_access_key
});


//Create Default Combined Transport at default level
var transport_combined = new (winston.transports.DailyRotateFile)({
    filename: `${logDir}/application-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: _config.logging.server_LogFileMaxSize,
    maxFiles: _config.logging.server_LogMaxFiles,
    handleExceptions: true,
    level: _config.logging.logDefaultLevel
});
transport_combined.on('rotate', function (oldFilename, newFilename) {
});



//Additional Error Transport at error level
var transport_error = new (winston.transports.DailyRotateFile)({
    filename: `${logDir}/error-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: _config.logging.server_LogFileMaxSize,
    maxFiles: _config.logging.server_LogMaxFiles,
    handleExceptions: true,
    level: 'error'
});
transport_error.on('rotate', function (oldFilename, newFilename) {
});


let transports_combined = [];
let transports_error = [];

if (_config.logging.enableConsoleLogging) {
    transports_combined.push(new (winston.transports.Console)({ level: _config.logging.logDefaultLevel }));
}

//If Server Logs Enabled
if (_config.logging.enableServerLogs) {
    // Create the log directory if it does not exist
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }

    transports_combined.push(transport_combined);
    transports_error.push(transport_error);
}

//If S3 Logging Enabled
if (_config.logging.enableS3Logging) {
    transports_combined.push(new (winston.transports.File)({ stream: s3stream_combined, level: _config.logging.logDefaultLevel }));
    transports_error.push(new (winston.transports.File)({ stream: s3stream_error, level: "error" }));
}

//If MongoDB Logging Enabled
if (_config.logging.enableMongoErrorLogging) {
    transports_combined.push(new (winston.transports.MongoDB)({  //MongoDB error transport
        db: _config.db_url,
        collection: "logs",
        level: "error"
    }));
}

if (!transports_combined.length) {
    transports_combined.push(new (winston.transports.Console)({ level: _config.logging.logDefaultLevel }));
}


//Default Logger Instance
var logger = winstonLog;
logger.configure({
    emitErrs: true,
    transports: transports_combined,
    exceptionHandlers: transports_combined,
    exitOnError: false
});

//Additional Logger instance for errorLogger
var errorLogger = new winston.Logger({
    emitErrs: true,
    transports: transports_error,
    exceptionHandlers: transports_error,
    exitOnError: false
});


export { logger, errorLogger };