import { service } from 'nodedata/di/decorators';
import { logger, errorLogger } from "../../../logging";
import { PrincipalContext } from 'nodedata/security/auth/principalContext';
import { CurrentUser } from "../../../models/common/currentUser";

export interface LoggerServiceInterface {
    logInfo(message: any, meta?: any);
    logDebug(message: any, meta?: any);
    logError(message: any, meta?: any);
}

@service({ singleton: true, serviceName: 'loggerService' })
export class LoggerService implements LoggerServiceInterface {

    logInfo(message: any, meta?: any) {
        let usr: CurrentUser = PrincipalContext.User;
        if (meta && !meta.user) {
            meta['user'] = { _id: usr.userId };
        }
        if (!meta || meta == undefined) {
            meta = {};
            meta['user'] = { _id: usr.userId };
        }
        logger.logInfo(message, meta || {});
        errorLogger.info(message, meta || {});
    }

    logDebug(message: any, meta?: any) {
        let usr: CurrentUser = PrincipalContext.User;
        if (meta && !meta.user) {
            meta['user'] = { _id: usr.userId };
        }
        if (!meta || meta == undefined) {
            meta = {};
            meta['user'] = { _id: usr.userId };
        }
        logger.logDebug(message, meta || {});
        errorLogger.debug(message, meta || {});
    }

    logError(message: any, meta?: any) {
        let usr: CurrentUser = PrincipalContext.User;
        if (meta && !meta.user) {
            meta['user'] = { _id: usr.userId };
        }
        if (!meta || meta == undefined) {
            meta = {};
            meta['user'] = { _id: usr.userId };
        }
        logger.logError(message, meta || {});
        errorLogger.error(message, meta || {});
    }
}

export default LoggerService;
