import { service } from 'nodedata/di/decorators/service';
import { SecurableEntity } from '../models/security/securable.entity';
import { CurrentUser } from '../models/common/currentUser';
import { PrincipalContext } from 'nodedata/security/auth/principalContext';
import { SecurityConstant } from '../utils/constants/securityConst';
import { config } from 'nodedata/core/utils';
import { RoleEnum } from '../securityConfig';
import * as utils from '../utils/UtilityFunctions';
import * as Enumerable from 'linq';
import { EntityActionParam } from "nodedata/core/decorators/entityAction";
import Q = require('q');

@service({ singleton: true, serviceName: 'workflowservice' })
export class WorkflowService {

    canDeleteEntity(entityAction: EntityActionParam) {
        let entity = entityAction.oldPersistentEntity;
        let currentUser: CurrentUser = PrincipalContext.User;
        let allow: boolean = true;
        return Q.when(allow);
    }

    canSaveEntities(entityActions: Array<EntityActionParam>) {
        let currentUser: CurrentUser = PrincipalContext.User;
        let canSave: boolean = true;
        let asynCalls = [];
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
        let allow: boolean = true;
        let currentUser: CurrentUser = PrincipalContext.User;
        if (config().Security.isAutheticationEnabled === SecurityConstant.Disabled_Authorization) {
            return Q.when(true);
        }
        if (!entity || !currentUser) {
            allow = false;
        }
        return Q.when(allow);
    }

    public canReadActionEntity(params: EntityActionParam) {
        let entity: SecurableEntity = params.newPersistentEntity;
        return Q.when(this.canReadEntity(entity));
    }

    canReadActionEntities(actionEntities: Array<EntityActionParam>) {
        let entities: Array<SecurableEntity> = actionEntities.map((e: EntityActionParam) => e.newPersistentEntity);
        return this.canReadEntities(entities).then((newEntities) => {
            if (newEntities instanceof Array) {
                let ids = newEntities.map(x => x._id.toString());
                // select only entities which have access
                actionEntities = Enumerable.from(actionEntities).where((x: EntityActionParam) => ids.indexOf(x.newPersistentEntity._id.toString()) != -1).toArray();
            }
            return Q.when(actionEntities);
        });
    }

    public canReadEntity(entity: SecurableEntity) {
        let allow: boolean = true;
        let currentUser: CurrentUser = PrincipalContext.User;
        if (config().Security.isAutheticationEnabled === SecurityConstant.Disabled_Authorization) {
            return true;
        }
        if (!entity || !currentUser) {
            allow = false;
        }
        if (utils.isRolePresent(RoleEnum[RoleEnum.ROLE_ADMIN], currentUser.getUserRole())) {
            allow = true;
        }
        return allow;
    }

    canReadEntities(entities: Array<SecurableEntity>) {
        let readableEntities = new Array<SecurableEntity>();
        let canSave: boolean = true;
        entities.forEach(entity => {
            if (this.canReadEntity(entity)) {
                readableEntities.push(entity);
            }
        });
        return Q.when(readableEntities);
    }
}

export default WorkflowService;
