import { field } from 'nodedata/mongoose/decorators';
import { jsonignore } from 'nodedata/core/decorators';
import { BaseEntity } from '../baseModels/base.entity';
import { PrincipalContext } from 'nodedata/security/auth/principalContext';
import { CurrentUser } from '../common/currentUser';
import { JsonIgnore } from 'nodedata/core/enums/jsonignore-enum';

export class AuditableEntity extends BaseEntity {

    @field()
    @jsonignore(JsonIgnore.READ)
    isDeleted: boolean;

    @field()
    @jsonignore(JsonIgnore.READ)
    isInactive: boolean;

    @field()
    @jsonignore(JsonIgnore.READ)
    createdBy: string;

    @field()
    @jsonignore(JsonIgnore.READ)
    createdByName: string;

    @field()
    @jsonignore(JsonIgnore.READ)
    createdDate: Date;

    @field()
    @jsonignore(JsonIgnore.READ)
    lastModifiedBy: string;

    @field()
    @jsonignore(JsonIgnore.READ)
    lastModifiedByName: string;

    @field()
    @jsonignore(JsonIgnore.READ)
    lastModifiedDate: Date;

    constructor(param?: any) {
        super();
        this.updateAudit(param);
    }

    updateAudit(param?) {
        let datenow = new Date();
        let currentUser: CurrentUser = PrincipalContext.User;
        if (param && !param._id) {
            if (currentUser) {
                this.createdBy = currentUser.userId;
                this.createdByName = currentUser.username;
                param.createdBy = currentUser.userId;
                param.createdByName = currentUser.username;
            }
            this.createdDate = datenow;
        }
        if (currentUser) {
            this.lastModifiedBy = currentUser.userId;
            this.lastModifiedByName = currentUser.username;
        }
        this.lastModifiedDate = datenow;
    }

    updateLastModified() {
        let currentUser: CurrentUser = PrincipalContext.User;
        this.lastModifiedDate = new Date();
        this.lastModifiedBy = currentUser.userId;
        this.lastModifiedByName = currentUser.username;
    }
}

export default AuditableEntity;
