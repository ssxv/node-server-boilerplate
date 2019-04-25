import * as workFlowService from './workflowservice';
import { PrincipalContext } from 'nodedata/security/auth/principalContext';
import { entityAction, EntityActionParam } from "nodedata/core/decorators/entityAction";
import { postfilter } from "nodedata/core/decorators/postfilter";
import { DynamicRepository } from 'nodedata/core/dynamic/dynamic-repository';
import { inject } from 'nodedata/di/decorators/inject';
import Q = require('q');
import * as Logger from "../services/common/services/LoggerService";


export class AuthorizationRepository extends DynamicRepository {

    ///Entity action Mehods
    @inject(Logger)
    private logger: Logger.LoggerService;

    @inject(workFlowService)
    private _workFlowService: workFlowService.WorkflowService;

    preCreate(params: EntityActionParam): Q.Promise<EntityActionParam> {
        return Q.resolve(params);
    }

    postCreate(params: EntityActionParam): Q.Promise<any> {
        return Q.when(params.newPersistentEntity);
    }

    preUpdate(params: EntityActionParam): Q.Promise<EntityActionParam> {
        return Q.resolve(params);
    }

    postUpdate(params: EntityActionParam): Q.Promise<EntityActionParam> {
        return Q.when(params);
    }


    preBulkCreate(params: Array<EntityActionParam>): Q.Promise<Array<EntityActionParam>> {
        return Q.resolve(params);
    }

    preBulkDelete(params: Array<EntityActionParam>): Q.Promise<Array<EntityActionParam>> {
        return Q.resolve(params);
    }

    postBulkCreate(params: Array<EntityActionParam>): Q.Promise<Array<EntityActionParam>> {
        var updatedEntities = [];
        params.forEach((input: EntityActionParam) => { updatedEntities.push(input.newPersistentEntity); })
        return Q.when(updatedEntities);
    }

    preBulkUpdate(params: Array<EntityActionParam>): Q.Promise<Array<EntityActionParam>> {
        return Q.when(params);
    }

    postBulkUpdate(params: Array<EntityActionParam>): Q.Promise<Array<EntityActionParam>> {
        var updatedEntities = [];
        params.forEach((input: EntityActionParam) => { updatedEntities.push(input.newPersistentEntity); })
        return Q.when(updatedEntities);
    }

    preDelete(params: EntityActionParam): Q.Promise<EntityActionParam> {
        return Q.when(params);
    }

    postDelete(params: EntityActionParam): Q.Promise<EntityActionParam> {
        return Q.when(params.newPersistentEntity);
    }

    postBulkDelete(params: Array<EntityActionParam>): Q.Promise<Array<EntityActionParam>> {
        var updatedEntities = [];
        params.forEach((input: EntityActionParam) => { updatedEntities.push(input.newPersistentEntity); })
        return Q.when(updatedEntities);
    }

    preRead(params: EntityActionParam): Q.Promise<EntityActionParam> {
        return Q.when(params);
    }

    postRead(params: EntityActionParam): Q.Promise<any> {
        return Q.when(params);
    }

    preBulkRead(params: Array<EntityActionParam>): Q.Promise<Array<EntityActionParam>> {
        return Q.when(params);
    }

    postBulkRead(params: Array<EntityActionParam>): Q.Promise<Array<EntityActionParam>> {
        return Q.when(params);
    }

    @entityAction({ serviceName: "authorizationService", methodName: "canSaveEntities" })
    bulkPost(objArr: Array<any>, batchSize?: number): Q.Promise<any> {
        let actionEntities: Array<EntityActionParam> = this.getEntityFromArgs.apply(this, arguments);
        if (!actionEntities) {
            actionEntities = [];
        }
        this.logEntityInfo("bulkPost", objArr);
        return this._workFlowService.canSaveEntities(actionEntities).then(res => {
            if (!res) {
                return this.sendError();
            }
            return this.preBulkCreate(actionEntities)
                .then((params: Array<EntityActionParam>) => {
                    let entitiesToCreate: Array<any> = new Array<any>();
                    params.forEach((input: EntityActionParam) => { entitiesToCreate.push(input.inputEntity); });
                    arguments[0] = entitiesToCreate;
                    arguments[arguments.length - 1] = undefined;
                    return super.bulkPost.apply(this, arguments).then((createdDbOEntites: Array<any>) => {
                        let indexInMainCollection: number = 0;
                        createdDbOEntites && createdDbOEntites.length && createdDbOEntites.forEach((createdEntity) => {
                            actionEntities[indexInMainCollection].newPersistentEntity = createdEntity;
                            indexInMainCollection++;
                        })

                        return this.postBulkCreate(actionEntities);
                    }, (error) => {
                        this.logger.logError(error, { class: "AuthorizationRepository", method: "bulkPost" });
                        return Q.reject(error);
                    })
                }, (error) => {
                    this.logger.logError(error, { class: "AuthorizationRepository", method: "bulkPost" });
                    return Q.reject(error);
                });
        });

    }

    @entityAction({ serviceName: "authorizationService", methodName: "canSaveEntities" })
    bulkPut(objArr: Array<any>, batchSize?: number) {
        if (!objArr || !objArr.length) return Q.when(objArr);
        let actionEntities: Array<EntityActionParam> = this.getEntityFromArgs.apply(this, arguments);
        if (!actionEntities) {
            actionEntities = [];
        }
        this.logEntityInfo("bulkPut", objArr);
        return this._workFlowService.canSaveEntities(actionEntities).then(res => {
            if (!res) {
                return this.sendError();
            }
            return this.preBulkUpdate(actionEntities)
                .then((params: Array<EntityActionParam>) => {
                    let entitiesToCreate: Array<any> = new Array<any>();
                    params.forEach((input: EntityActionParam) => { entitiesToCreate.push(input.newPersistentEntity); })
                    arguments[0] = entitiesToCreate;
                    arguments[arguments.length - 1] = undefined;
                    return super.bulkPut.apply(this, arguments).then((createdDbOEntites: Array<any>) => {
                        let indexInMainCollection: number = 0;
                        createdDbOEntites && createdDbOEntites.length && createdDbOEntites.forEach((createdEntity) => {
                            actionEntities[indexInMainCollection].newPersistentEntity = createdEntity;
                            indexInMainCollection++;
                        })

                        return this.postBulkUpdate(actionEntities);
                    }, (error) => {
                        this.logger.logError(error, { class: "AuthorizationRepository", method: "bulkPut" });
                        return Q.reject(error);
                    })
                }, (error) => {
                    this.logger.logError(error, { class: "AuthorizationRepository", method: "bulkPut" });
                    return Q.reject(error);
                });
        });
    }

    @entityAction({ serviceName: "authorizationService", methodName: "canSaveEntities" })
    bulkDel(params: Array<any>) {
        let actionParams: Array<EntityActionParam> = this.getEntityFromArgs.apply(this, arguments);
        let entitiesToDelete = [];
        if (!actionParams) {
            actionParams = [];
        }
        this.logEntityInfo("bulkDel", params);
        actionParams.forEach((input: EntityActionParam) => { entitiesToDelete.push(input.newPersistentEntity); })
        return this._workFlowService.canSaveEntities(actionParams).then(res => {
            if (!res) {
                return this.sendError();
            }
            return this.preBulkDelete(actionParams)
                .then((params: Array<EntityActionParam>) => {
                    return super.bulkDel(entitiesToDelete).then((updatedDbObj: Array<any>) => {
                        return this.postBulkDelete(actionParams);
                    }, (error) => {
                        this.logger.logError(error, { class: "AuthorizationRepository", method: "bulkDel" });
                        return Q.reject(error);
                    })
                }, (error) => {
                    this.logger.logError(error, { class: "AuthorizationRepository", method: "bulkDel" });
                    return Q.reject(error);
                });
        });
    }

    // TODO: need to disccus whether we need to secure bulkPutMany action since it is not exposed  api, it is consumed by server only.
    //@entityAction({ serviceName: "authorizationService", methodName: "canSaveEntities" })
    public bulkPutMany(objIds: Array<any>, obj: any) {
        obj._id = objIds[0];
        this.logger.logInfo("Starting bulkPutMany Method", { class: "AuthorizationRepository", method: "bulkPutMany" });
        return super.bulkPutMany(objIds, obj);
    }

    @entityAction({ serviceName: "authorizationService", methodName: "canReadActionEntity" }) // ACL part
    findOne(id: any, donotLoadChilds?: boolean): Q.Promise<any> {
        this.logger.logInfo("Starting findOne Method", { class: "AuthorizationRepository", method: "findOne" });
        let params: EntityActionParam = this.getEntityFromArgs.apply(this, arguments);
        if (!params) {
            params = {};
        }
        return this._workFlowService.canReadActionEntity(params).then(res => {
            if (!res) {
                params = {};
            }
            return this.preRead(params).then(result => {
                return this.postRead(result).then((updatedParams: EntityActionParam) => {
                    return Q.resolve(updatedParams.newPersistentEntity);
                }).catch(exc => {
                    this.logger.logError(exc, { class: "AuthorizationRepository", method: "findOne" });
                    return Q.reject(exc);
                });
            }).catch(exc => {
                this.logger.logError(exc, { class: "AuthorizationRepository", method: "findOne" });
                return Q.reject(exc);
            });
        });
    }

    @entityAction({ serviceName: "authorizationService", methodName: "canReadActionEntities" }) // ACL part
    findMany(ids: Array<any>, toLoadEmbededChilds?: boolean): Q.Promise<any> {
        let actionEntities: Array<EntityActionParam> = this.getEntityFromArgs.apply(this, arguments);
        if (!actionEntities) {
            actionEntities = [];
        }
        return this._workFlowService.canReadActionEntities(actionEntities).then(res => {
            actionEntities = res;
            return this.preBulkRead(actionEntities).then(results => {
                return this.postBulkRead(results).then(newResults => {
                    return Q.when(newResults.map(entity => entity.newPersistentEntity));
                }).catch(exc => {
                    this.logger.logError(exc, { class: "AuthorizationRepository", method: "findMany" });
                    return Q.reject(exc);
                });
            }).catch(exc => {
                this.logger.logError(exc, { class: "AuthorizationRepository", method: "findMany" });
                return Q.reject(exc);
            });
        });
    }

    @entityAction({ serviceName: "authorizationService", methodName: "canReadActionEntities" }) // ACL part
    findWhere(query, selectedFields?: Array<any> | any, queryOptions?: any, toLoadChilds?: boolean): Q.Promise<any> {
        let actionEntities: Array<EntityActionParam> = this.getEntityFromArgs.apply(this, arguments);
        if (!actionEntities) {
            actionEntities = [];
        }
        return this._workFlowService.canReadActionEntities(actionEntities).then(res => {
            actionEntities = res;
            return this.preBulkRead(actionEntities).then(results => {
                return this.postBulkRead(results).then(newResults => {
                    return Q.when(newResults.map(entity => entity.newPersistentEntity));
                }).catch(exc => {
                    this.logger.logError(exc, { class: "AuthorizationRepository", method: "findWhere" });
                    return Q.reject(exc);
                });
            }).catch(exc => {
                this.logger.logError(exc, { class: "AuthorizationRepository", method: "findWhere" });
                return Q.reject(exc);
            });
        });
    }

    findByField(fieldName, value): Q.Promise<any> {
        return super.findByField(fieldName, value);
    }

    @postfilter({ serviceName: "authorizationService", methodName: "canReadChildren" }) // ACL part
    findChild(id, prop): Q.Promise<any> {
        return super.findChild(id, prop);
    }


    @entityAction({ serviceName: "authorizationService", methodName: "canSaveEntity" })
    put(id: any, obj: any): Q.Promise<any> {
        let resultEntityActionObj: EntityActionParam = this.getEntityFromArgs.apply(this, arguments);
        if (!resultEntityActionObj) {
            resultEntityActionObj = {};
        }
        this.logEntityInfo("put", obj);
        return this._workFlowService.canSaveEntity(resultEntityActionObj).then(res => {
            if (!res) {
                return this.sendError();
            }
            return this.preUpdate(resultEntityActionObj)
                .then((params: EntityActionParam) => {
                    return super.put(id, params.newPersistentEntity).then((updatedDbObj: any) => {
                        resultEntityActionObj.newPersistentEntity = updatedDbObj;
                        return this.postUpdate(resultEntityActionObj).then((updatedEntity: EntityActionParam) => {
                            return Q.when(updatedEntity.newPersistentEntity);
                        }, (exc) => {
                            this.logger.logError(exc, { class: "AuthorizationRepository", method: "put" });
                            return Q.reject(exc);
                        });
                    }, (error) => {
                        this.logger.logError(error, { class: "AuthorizationRepository", method: "put" });
                        return Q.reject(error);
                    })
                }, (error) => {
                    this.logger.logError(error, { class: "AuthorizationRepository", method: "put" });
                    return Q.reject(error);
                });
        });
    }


    @entityAction({ serviceName: "authorizationService", methodName: "canSaveEntity" })
    post(obj: any): Q.Promise<any> {
        this.logEntityInfo("post", obj);
        let resultEntityActionObj: EntityActionParam = this.getEntityFromArgs.apply(this, arguments);
        if (!resultEntityActionObj) {
            resultEntityActionObj = {};
        }
        return this._workFlowService.canSaveEntity(resultEntityActionObj).then(res => {
            if (!res) {
                return this.sendError();
            }
            return this.preCreate(resultEntityActionObj)
                .then((params: EntityActionParam) => {
                    return super.post(params.inputEntity).then((updatedDbObj: any) => {
                        resultEntityActionObj.newPersistentEntity = updatedDbObj;
                        return this.postCreate(resultEntityActionObj);
                    }, (error) => {
                        this.logger.logError(error, { class: "AuthorizationRepository", method: "post" });
                        return Q.reject(error);
                    })
                }, (error) => {
                    this.logger.logError(error, { class: "AuthorizationRepository", method: "post" });
                    return Q.reject(error);
                });
        });
    }

    @entityAction({ serviceName: "authorizationService", methodName: "canDeleteEntity" })
    delete(obj: any) {
        let resultEntityActionObj: EntityActionParam = this.getEntityFromArgs.apply(this, arguments);
        if (!resultEntityActionObj) {
            resultEntityActionObj = {};
        }
        this.logEntityInfo("delete", resultEntityActionObj.newPersistentEntity._id);
        return this._workFlowService.canDeleteEntity(resultEntityActionObj).then(success => {
            if (!success) {
                return this.sendError();
            }
            return this.preDelete(resultEntityActionObj)
                .then((params: EntityActionParam) => {
                    return super.delete(resultEntityActionObj.newPersistentEntity._id).then((updatedDbObj: any) => {
                        resultEntityActionObj.newPersistentEntity = updatedDbObj;
                        return this.postDelete(resultEntityActionObj);
                    }, (error) => {
                        this.logger.logError(error, { class: "AuthorizationRepository", method: "delete" });
                        return Q.reject(error);
                    })
                }, (error) => {
                    this.logger.logError(error, { class: "AuthorizationRepository", method: "delete" });
                    return Q.reject(error);
                });
        });
    }

    @entityAction({ serviceName: "authorizationService", methodName: "canSaveEntity" })
    patch(id: any, obj) {
        this.logEntityInfo("patch", obj);
        let resultEntityActionObj: EntityActionParam = this.getEntityFromArgs.apply(this, arguments);
        if (!resultEntityActionObj) {
            resultEntityActionObj = {};
        }
        return this._workFlowService.canSaveEntity(resultEntityActionObj).then(res => {
            if (!res) {
                return this.sendError();
            }
            return this.preUpdate(resultEntityActionObj)
                .then((params: EntityActionParam) => {
                    return super.patch(id, params.inputEntity).then((updatedDbObj: any) => {
                        resultEntityActionObj.newPersistentEntity = updatedDbObj;
                        // return this.postUpdate(resultEntityActionObj.newPersistentEntity);
                        return this.postUpdate(resultEntityActionObj).then((updatedEntity: EntityActionParam) => {
                            return Q.when(updatedEntity.newPersistentEntity);
                        }, (exc) => {
                            this.logger.logError(exc, { class: "AuthorizationRepository", method: "patch" });
                            return Q.reject(exc);
                        });
                    }, (error) => {
                        this.logger.logError(error, { class: "AuthorizationRepository", method: "patch" });
                        return Q.reject(error);
                    })
                }, (error) => {
                    this.logger.logError(error, { class: "AuthorizationRepository", method: "patch" });
                    return Q.reject(error);
                });
        });
    }

    @entityAction({ serviceName: "authorizationService", methodName: "canReadActionEntities" }) // ACL part
    findAll(): any {
        let actionEntities: Array<EntityActionParam> = this.getEntityFromArgs.apply(this, arguments);
        if (!actionEntities) {
            actionEntities = [];
        }
        return this._workFlowService.canReadActionEntities(actionEntities).then(res => {
            actionEntities = res;
            return this.postBulkRead(actionEntities).then((newResults: Array<EntityActionParam>) => {
                return Q.when(newResults.map((x: EntityActionParam) => x.newPersistentEntity));
            }).catch(exc => {
                this.logger.logError(exc, { class: "AuthorizationRepository", method: "findAll" });
                return Q.reject(exc);
            });
        });
    }

    getEntityType(): any {
        return super.getEntityType();
    }

    private getEntityFromArgs() {
        let args: Array<any> = Array.apply(null, arguments);
        let params: EntityActionParam = <EntityActionParam>args[args.length - 1];
        return params;
    }

    private logEntityInfo(methodName: string, obj: any) {
    }

    private sendError() {
        var error = 'unauthorize access for resource';
        var res = PrincipalContext.get('res');
        if (res) {
            res.set("Content-Type", "application/json");
            res.send(403, JSON.stringify(error, null, 4));
        }
        return Q.reject(error);
    }

    getLogger() {
        return this.logger;
    }
}

export default AuthorizationRepository;
