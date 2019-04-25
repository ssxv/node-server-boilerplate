﻿import { MetaUtils } from "nodedata/core/metadata/utils";
import { DecoratorType } from 'nodedata/core/enums/decorator-type';
import { Decorators } from './decorators';

export function canSave(params?: any) {
    return function (target: Object, propertyKey: string) {
        MetaUtils.addMetaData(target,
            {
                decorator: Decorators.CANSAVE,
                decoratorType: DecoratorType.PROPERTY,
                params: params,
                propertyKey: propertyKey
            });
    }
}
