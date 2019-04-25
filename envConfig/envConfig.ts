const getEnv = require("get-env");

const env = getEnv({
    staging: "staging",
    test: ["test", "testing"],
    dev: ["development", "dev", "develop"],
    prod: ["production", "prod"]
});

export type emailConfig = {
    key: string,
    secret: string
}

export type facebookTokenUrl = {
    facebookMsLongLivedAccessToken: string,
    facebookMsCheckExpiry: string,
    facebookMsExchangeLongLivedAccessToken: string,
    facebookRateLimitStatus: string
};


export type twitterTokenUrl = {
    twitterMsCheckExpiry: string,
    twittterRateLimitStatus: string,
    twitterUserInfo: string
};

export type loggingType = {
    "enableServerLogs": boolean,
    "enableConsoleLogging": boolean,
    "enableS3Logging": boolean,
    "enableMongoErrorLogging": boolean,
    "server_LogDir": string,
    "server_LogFileMaxSize": string,
    "server_LogMaxFiles": string,
    "s3_access_key_id": string,
    "s3_secret_access_key": string,
    "s3_max_file_size": number,
    "s3_bucket": string,
    "s3_applicationLogsFolder": string,
    "s3_errorLogsFolder": string,
    "s3_applicationLogsNameFormat": string,
    "s3_errorLogsNameFormat": string,
    "logDefaultLevel": string,
    "s3RotateEvery": number
};

export type apiKeyDetails = {
    apiKey: Array<string>,
    profileKey: Array<string>,
    limit: number,
    resetInterval: number,
    defaultUnchekedLimit: number
};

export type apiKeys = {
    google: apiKeyDetails
};

export type configType = {
    env: string,
    "db_url": string,
    "host_url": string,
    "sendGrid_key": string,
    "bccMailList": Array<string>,
    "base_path": string,
    "apiKeys": apiKeys,
    "ignorePaths": Array<string>,
    "authorizeNetLogInId": string,
    "authorizeNetTransactionKey": string,
    "s3Config": any,
    "s3Region": string,
    "s3BucketName": string,
    "s3ReactBucketXML": string,
    "authLive": boolean,
    "logging": loggingType
};
const baseConfig = require("./baseConfig.json");
const overridingConfig = require("./" + env + "Config");

export let config: configType = baseConfig;

Object.assign(config, baseConfig, overridingConfig);

config.env = env;
