import { MetaUtils } from "nodedata/core/metadata/utils";
import * as Utils from "nodedata/core/utils";
import { Decorators } from 'nodedata/core/constants/decorators';
import { winstonLog } from 'nodedata/logging/winstonLog';
import * as Enumerable from 'linq';
var Q = require('q');

export class ServiceExecutor {

    static execute(serviceName: string, methodName: string, params: any) {
        var services = MetaUtils.getMetaDataForDecorators([Decorators.SERVICE]);
        var service = Enumerable.from(services).where(x => x.metadata[0].params.serviceName == serviceName).select(x => x.metadata[0]).firstOrDefault();
        if (service) {
            var param = [];
            param.push(params);
            var ret = service.target[methodName].apply(service.target, param);
            if (Utils.isPromise(ret)) {
                return ret.then(result => {
                    return result;
                }).catch((err) => {
                    winstonLog.logError('[ServiceExecutor : execute]: error ' + err);
                    throw err;
                });
            }
            else {
                return Q.when(ret);
            }
        }
        return Q.when(true);
    }
}

export default ServiceExecutor;