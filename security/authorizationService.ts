import { SystemContexts } from '../utils/enums/resources';
import { inject } from 'nodedata/di/decorators/inject';
import { service } from 'nodedata/di/decorators/service';
import { SecurableEntity } from '../models/security/securable.entity';
import { CurrentUser } from '../models/common/currentUser';
import { PrincipalContext } from 'nodedata/security/auth/principalContext';
import { SecurityConstant } from '../utils/constants/securityConst';
import { config } from 'nodedata/core/utils';
import { AccessMask } from '../securityConfig';
import { WorkFlowEntity } from "../models/security/workflow.entity";
import * as Enumerable from 'linq';
import { EntityActionParam } from "nodedata/core/decorators/entityAction";
import { AccessControlMaskUtil } from '../utils/security/accessControlMaskUtil';
import Q = require('q');
import * as Logger from "../services/common/services/LoggerService";

@service({ singleton: true, serviceName: 'authorizationService' })
export class AuthorizationService {

    @inject(Logger)
    private logger: Logger.LoggerService;

    canDeleteEntity(entityAction: EntityActionParam) {
        let entity = entityAction.oldPersistentEntity;
        if (config().Security.isAutheticationEnabled === SecurityConstant.Disabled_Authorization) {
            return Q.when(true);
        }

        let currentUser: CurrentUser = PrincipalContext.User;
        if (currentUser.viewContext == SystemContexts.SHEET_DB_CONTEXT)
            return Q.when(true);
        if (this.checkForDeletePermission(currentUser, entity)) {
            return Q.when(true);
        }
        return Q.when(false);

    }

    canSaveEntities(entityActions: Array<EntityActionParam>) {
        if (!entityActions || !entityActions.length) {
            return Q.when(true);
        }

        let currentUser: CurrentUser = PrincipalContext.User;

        let entities: Array<SecurableEntity> = new Array<SecurableEntity>();
        entityActions.forEach((entityAction: EntityActionParam) => { entities.push(entityAction.newPersistentEntity); })

        if (config().Security.isAutheticationEnabled === SecurityConstant.Disabled_Authorization) {
            return Q.when(true);
        }
        if (currentUser.viewContext == SystemContexts.SHEET_DB_CONTEXT)
            return Q.when(true);
        let canSave: boolean = true;
        let asynCalls = [];
        let firstEntity = entityActions[0].newPersistentEntity;
        entityActions.forEach(entity => {
            asynCalls.push(this.canSaveEntity(entity, true));
        });
        return Q.allSettled(asynCalls).then(succuss => {
            succuss.forEach(s => {
                if (!s.value) {
                    canSave = false;
                }
            })
            return canSave;
        });
    }

    canSaveEntity(entityAction: EntityActionParam, eventStatusCheckNotRequired?: boolean): Q.Promise<any> {
        let entity: SecurableEntity = entityAction.newPersistentEntity;
        if (config().Security.isAutheticationEnabled === SecurityConstant.Disabled_Authorization) {
            return Q.when(true);
        }

        let currentUser: CurrentUser = PrincipalContext.User;
        var userId = currentUser.userId;
        if (!currentUser)
            return Q.when(false);
        if (currentUser.viewContext == SystemContexts.SHEET_DB_CONTEXT)
            return Q.when(true);
        if (!entity)
            return Q.when(false);

        let promiseOfEventStatus = Q.when(true);

        return promiseOfEventStatus.then(succuss => {
            if (succuss) {
                if (!entity.createdBy || !entity._id) { // case create
                    entity.createdBy = userId;
                    entity.createdByName = currentUser.username;
                    entity.createdDate = new Date();
                    return Q.when(true);
                }

                if (this.checkWritePermissionForCurrentUser(currentUser, entity)) {
                    entity.updateLastModified();
                    return Q.when(true);
                }

                let workFlowEntity = <WorkFlowEntity>entityAction.newPersistentEntity;

                return Q.when(false);

            }
            return Q.when(false);
        }).catch(exc => {
            this.logger.logError(exc, { class: "AuthorizationService", method: "canSaveEntity" });
            return Q.reject(false);
        });

    }

    public canReadActionEntity(params: EntityActionParam) {
        let entity: SecurableEntity = params.newPersistentEntity;
        return this.canReadEntity(entity);
    }

    public canReadEntity(entity: SecurableEntity): SecurableEntity {
        if (config().Security.isAutheticationEnabled === SecurityConstant.Disabled_Authorization) {
            return entity;
        }

        let currentUser: CurrentUser = PrincipalContext.User;
        if (currentUser.viewContext == SystemContexts.SHEET_DB_CONTEXT)
            return entity;
        if (this.checkReadEntity(entity)) {

            return entity;
        }
        return null;

    }

    private checkReadEntity(entity: SecurableEntity): boolean {
        if (config().Security.isAutheticationEnabled === SecurityConstant.Disabled_Authorization) {
            return true;
        }

        if (!entity)
            return false;

        if (entity.isDeleted != null && entity.isDeleted)
            return false;

        let currentUser: CurrentUser = PrincipalContext.User;

        if (!currentUser)
            return false;

        if (this.checkForReadPermission(currentUser, entity)) {
            this.setWhatAccessOnEntity(currentUser, entity);
            return true;
        }

        return false;
    }

    canReadActionEntities(actionEntities: Array<EntityActionParam>) {
        let entities: Array<SecurableEntity> = actionEntities.map((e: EntityActionParam) => e.newPersistentEntity);
        return this.canReadEntities(entities);
    }

    canReadRepository(entities: Array<SecurableEntity>) {
        return entities;
    }

    canReadEntities(entities: Array<SecurableEntity>) {

        if (config().Security.isAutheticationEnabled === SecurityConstant.Disabled_Authorization) {
            return entities;
        }

        let readableEntities = new Array<SecurableEntity>();
        entities.forEach(entity => {
            let qualifiedEntity = this.canReadEntity(entity);
            qualifiedEntity && readableEntities.push(qualifiedEntity);
        });

        return readableEntities;
    }

    canReadChildren(entity: any): any {
        var entities = <Array<any>>entity;
        if (entities) {
            return this.canReadEntities(entities);
        }
        else {
            return this.canReadEntity(entity);
        }
    }

    filterResult(results: Array<any>) {
        return results;
    }

    canReadForWrite(curUser: CurrentUser, entity: SecurableEntity): boolean {
        return true;
    }

    private checkWritePermissionForCurrentUser(curUser: CurrentUser, entity: SecurableEntity): boolean {
        if (config().Security.isAutheticationEnabled === SecurityConstant.Disabled_Authorization)
            return true;

        if (!curUser)
            return false;
        if (!entity)
            return false;

        if (entity.createdBy && entity.createdBy == curUser.userId) {
            let accessGranted = this.checkPermissionForCreator(entity);
            if (accessGranted != null) {
                return accessGranted;
            }
        }

        if (entity.globalAccessMask) {
            if (AccessControlMaskUtil.hasWritePermission(entity.globalAccessMask))
                return true;
        }

        if (entity.rolesAccessMask) {
            if (AccessControlMaskUtil.hasRoleWritePermission(entity.rolesAccessMask, curUser.getUserRole()))
                return true;
        }

        if (entity.usersAccessMask) {
            if (AccessControlMaskUtil.hasUserWritePermission(entity.usersAccessMask, curUser.userId))
                return true;
        }

        return false;

    }

    private checkPermissionForCreator(entity: SecurableEntity): boolean {

        if (!entity)
            return false;
        let curUser = PrincipalContext.User;
        return null;

    }

    private checkForReadPermission(curUser: CurrentUser, entity: SecurableEntity): boolean {
        if (entity.globalAccessMask) {
            if (AccessControlMaskUtil.hasReadPermission(entity.globalAccessMask))
                return true;
        }

        if (entity.rolesAccessMask) {
            if (AccessControlMaskUtil.hasRoleReadPermission(entity.rolesAccessMask, curUser.getUserRole()))
                return true;
        }

        if (entity.usersAccessMask) {
            if (AccessControlMaskUtil.hasUserReadPermission(entity.usersAccessMask, curUser.userId))
                return true;
        }
        return false;
    }

    private checkForDeletePermission(curUser: CurrentUser, entity: SecurableEntity): boolean {
        if (config().Security.isAutheticationEnabled === SecurityConstant.Disabled_Authorization)
            return true;

        if (!curUser)
            return false;
        if (!entity)
            return false;

        if (entity.createdBy && entity.createdBy == curUser.userId) {
            let accessGranted = this.checkPermissionForCreator(entity);
            if (accessGranted != null) {
                return accessGranted;
            }
        }

        if (entity.globalAccessMask) {
            if (AccessControlMaskUtil.hasDeletePermission(entity.globalAccessMask))
                return true;
        }

        if (entity.rolesAccessMask) {
            if (AccessControlMaskUtil.hasRoleDeletePermission(entity.rolesAccessMask, curUser.getUserRole()))
                return true;
        }

        if (entity.usersAccessMask) {
            if (AccessControlMaskUtil.hasUserDeletePermission(entity.usersAccessMask, curUser.userId))
                return true;
        }
        return false;
    }

    private checkForPublishPermission(curUser: CurrentUser, entity: SecurableEntity): boolean {
        if (config().Security.isAutheticationEnabled === SecurityConstant.Disabled_Authorization)
            return true;

        if (!curUser)
            return false;
        if (!entity)
            return false;

        if (entity.createdBy && entity.createdBy == curUser.userId) {
            let accessGranted = this.checkPermissionForCreator(entity);
            if (accessGranted != null) {
                return accessGranted;
            }
        }

        if (entity.globalAccessMask) {
            if (AccessControlMaskUtil.hasPublishPermission(entity.globalAccessMask))
                return true;
        }

        if (entity.rolesAccessMask) {
            if (AccessControlMaskUtil.hasRolePublishPermission(entity.rolesAccessMask, curUser.getUserRole()))
                return true;
        }

        if (entity.usersAccessMask) {
            if (AccessControlMaskUtil.hasUserPublishPermission(entity.usersAccessMask, curUser.userId))
                return true;
        }
        return false;
    }

    private checkForUnPublishPermission(curUser: CurrentUser, entity: SecurableEntity): boolean {
        if (config().Security.isAutheticationEnabled === SecurityConstant.Disabled_Authorization)
            return true;

        if (!curUser)
            return false;
        if (!entity)
            return false;

        if (entity.createdBy && entity.createdBy == curUser.userId) {
            return true;
        }

        if (entity.globalAccessMask) {
            if (AccessControlMaskUtil.hasUnPublishPermission(entity.globalAccessMask))
                return true;
        }

        if (entity.rolesAccessMask) {
            if (AccessControlMaskUtil.hasRoleUnPublishPermission(entity.rolesAccessMask, curUser.getUserRole()))
                return true;
        }

        if (entity.usersAccessMask) {
            if (AccessControlMaskUtil.hasUserUnPublishPermission(entity.usersAccessMask, curUser.userId))
                return true;
        }
        return false;
    }

    private checkForCreatePermission(curUser: CurrentUser, entity: SecurableEntity): boolean {
        if (config().Security.isAutheticationEnabled === SecurityConstant.Disabled_Authorization)
            return true;

        if (!curUser)
            return false;
        if (!entity)
            return false;

        if (entity.createdBy && entity.createdBy == curUser.userId) {
            let accessGranted = this.checkPermissionForCreator(entity);
            if (accessGranted != null) {
                return accessGranted;
            }
        }

        if (entity.globalAccessMask) {
            if (AccessControlMaskUtil.hasCreatePermission(entity.globalAccessMask))
                return true;
        }

        if (entity.rolesAccessMask) {
            if (AccessControlMaskUtil.hasRoleCreatePermission(entity.rolesAccessMask, curUser.getUserRole()))
                return true;
        }

        if (entity.usersAccessMask) {
            if (AccessControlMaskUtil.hasUserCreatePermission(entity.usersAccessMask, curUser.userId))
                return true;
        }
        return false;
    }

    private getAccessMaskForEntity(curUser: CurrentUser, entity: SecurableEntity) {
        // set accessmask for frontend what can do with this entity
        let accessMask = AccessMask.READ; // can read of course

        if (entity.getAccessMaskOnEntity) {
            var mask = entity.getAccessMaskOnEntity();
            if (mask) {
                return mask;
            }
        }

        this.checkWritePermissionForCurrentUser(curUser, entity) && (accessMask += AccessMask.WRITE);

        this.checkForCreatePermission(curUser, entity) && (accessMask += AccessMask.CREATE);

        this.checkForDeletePermission(curUser, entity) && (accessMask += AccessMask.DELETE);

        this.checkForPublishPermission(curUser, entity) && (accessMask += AccessMask.PUBLISH);

        this.checkForUnPublishPermission(curUser, entity) && (accessMask += AccessMask.UNPUBLISH);

        return accessMask;
    }

    /**
     * Set what are the access on the entity that will use by front-end
     * @param curUser
     * @param entity
     */
    private setWhatAccessOnEntity(curUser: CurrentUser, entity: SecurableEntity) {

        if (!entity)
            return;

        entity.accessMask = this.getAccessMaskForEntity(curUser, entity);
    }

    /**
     * recursively set access mask to all childerns
     * @param parentEntity
     */
    private cascadeToChildren(parentEntity: SecurableEntity) {
        if (!parentEntity)
            return;

        if (!parentEntity.getAllChildren)
            return;

        let childrens = <Array<SecurableEntity>>(parentEntity.getAllChildren());
        parentEntity.setRoleAccessMask({ "ROLE_AUTHOR": "P_AUTHOR" });

        if (childrens && childrens.length < 1)
            return;
        Enumerable.from(childrens).forEach(child => {
            // for strings, numbers etc don't cascade
            if (child instanceof Object) {
                child.createdBy = parentEntity.createdBy;
                child.createdByName = parentEntity.createdByName;
                child.createdDate = parentEntity.createdDate;
                child.lastModifiedBy = parentEntity.lastModifiedBy;
                child.lastModifiedByName = parentEntity.lastModifiedByName;
                child.lastModifiedDate = parentEntity.lastModifiedDate;

                this.cascadeToChildren(child);
            }
        });
        return;
    }

}

export default AuthorizationService;
