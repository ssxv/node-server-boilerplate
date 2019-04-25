import { SecurityConstant } from './utils/constants/securityConst';
import { config as _config } from "./envConfig/envConfig";

export class Config {
    public static DbConnection: string = _config.db_url;
    public static basePath: string = _config.base_path;
    public static apiversion: string = "v1";

    public static ElasticSearchConnection: string = "http://localhost:9200";
    public static ApplyElasticSearch: boolean = false;
    public static ignorePaths = _config.ignorePaths;
}

export class Security {
    public static isAutheticationEnabled = SecurityConstant.EnabledWith_Authorization;//allowed values: "disabled","enabledWithoutAuthorization","enabledWithAuthorization"
    public static authenticationType = SecurityConstant.TokenBased;//allowed values: "passwordBased","TokenBased"
    public static overrideLogin = true;
    public static defaultNetSession: string = "master";
}

export class facebookAuth {
    public static clientID = '11';// your App ID
    public static clientSecret = 'aa';// your App Secret
    public static callbackURL = 'http://localhost:23548/auth/facebook/callback';
}

export class passportSet {
    public static passport;

    public static setPassport(pasportInstance) {
        passportSet.passport = pasportInstance;
    }

    public static getPassport() {
        return passportSet.passport;
    }
}
