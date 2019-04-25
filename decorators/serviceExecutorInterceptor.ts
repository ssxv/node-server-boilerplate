import { MetaUtils } from "nodedata/core/metadata/utils";
import * as Utils from "nodedata/core/utils";
import { Decorators } from './decorators';
import { DecoratorType } from 'nodedata/core/enums/decorator-type';
//var domain = require('../../security/auth/domain');
import { ServiceExecutor } from './serviceExecutor';
import { IExecutorServiceParams } from './interfaces/executorServiceParams';

export function executeService(params?: IExecutorServiceParams): any {
    params = params || <any>{};

    return function (target: Function, propertyKey: string, descriptor: any) {
        MetaUtils.addMetaData(target,
            {
                decorator: Decorators.AUTHORINGSTATUS,
                decoratorType: DecoratorType.METHOD,
                params: params,
                propertyKey: propertyKey
            });

        var originalMethod = descriptor.value;

        descriptor.value = function () {
            var args = Array.apply(this, arguments);
            return ServiceExecutor.execute(params.serviceName, params.methodName, args[0]).then(result => {
                return originalMethod.apply(this, arguments);
            });
        }
        return descriptor;
    };
}
