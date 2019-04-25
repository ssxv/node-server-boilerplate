import { field } from 'nodedata/mongoose/decorators';
import * as utility from '../../utils/UtilityFunctions';
import { jsonignore } from 'nodedata/core/decorators';
import { AuditableEntity } from './auditable.entity';
import { propagate } from "../../decorators";
import * as Enumerable from 'linq';


export class SecurableEntity extends AuditableEntity {

    @field()
    globalAccessMask: number; // number for read, write, etc...

    @field()
    @jsonignore()
    usersAccessMask: any; // json data eg.-{"userId": "Permission Access type"} -> { "23719" : "P_AUTHOR", "34245": "P_SUPPLIER" } --*P_AUTHOR = Permission Author

    @field()
    accessMask: number;

    @field()
    @jsonignore()
    rolesAccessMask: any; // json data eg.- {"Role name": "Permission Access type"} -> { "ROLE_AUTHOR" : "P_AUTHOR" }

    @field()
    acl: any; //{"globalAccessMask":"","usersAccessMask":"{"2122":"2","3233":"22"}","rolesAccessMask":""}

    @propagate()
    @field({ itemType: Number })
    excludedUsers: Array<number>;

    /**
     * set global mask of own and its children
     * @param mask
     */
    setGlobalAccessMask(mask: number) {
        if (this.globalAccessMask == mask)
            return;

        this.globalAccessMask = mask;
        let childrens = <Array<SecurableEntity>>(this.getAllChildren());

        if (!childrens)
            return;

        Enumerable.from(childrens).forEach(child => {
            child.setGlobalAccessMask(mask);
        });
    }

    resetAllAuthorMask(findMask, replaceMask) {
        if (!this.usersAccessMask) {
            return;
        }
        this.resetAllAuthorMAskWithoutCascade(findMask, replaceMask);
        let childrens = <Array<SecurableEntity>>(this.getAllChildren());

        if (!childrens || childrens.length == 0)
            return;

        Enumerable.from(childrens).forEach(child => {
            child && child.resetAllAuthorMask && child.resetAllAuthorMask(findMask, replaceMask);
        });
    }

    resetAllAuthorMAskWithoutCascade(findMask, replaceMask) {
        Enumerable.from(this.usersAccessMask).forEach((keyVal: any) => {
            if (this.usersAccessMask[keyVal.key] == findMask) {
                this.usersAccessMask[keyVal.key] = replaceMask;
            }
        });
    }

    /**
     * set user access mask of own and its children
     * @param userMask
     */
    setUserAccessMask(userMask: Object) {
        if (!userMask)
            return;
        this.setUsersAccessMaskWithoutCascade(userMask);

        let childrens = <Array<SecurableEntity>>(this.getAllChildren());

        if (!childrens || childrens.length == 0)
            return;

        Enumerable.from(childrens).forEach(child => {
            child && child.setUserAccessMask && child.setUserAccessMask(userMask);
        });
    }

    /**
     * set user access mask of own
     * @param userMask
     */
    setUsersAccessMaskWithoutCascade(userMask: Object) {
        if (!userMask)
            return;

        if (!this.usersAccessMask) {
            this.usersAccessMask = {};
        }

        for (let userId in userMask) {
            this.usersAccessMask[userId] = userMask[userId];
        }
    }

    /**
     * set role access mask of own and its children
     * @param roleMask
     */
    setRoleAccessMask(roleMask: Object) {
        if (!roleMask)
            return;
        this.setRoleAccessMaskWithoutCascade(roleMask);

        let childrens = <Array<SecurableEntity>>(this.getAllChildren());

        if (!childrens)
            return;

        for (let i = 0; i < childrens.length; i++) {
            childrens[i].setRoleAccessMask && childrens[i].setRoleAccessMask(roleMask);
        }
        return;
    }

    /**
     * set role access mask of own
     * @param roleMask
     */
    setRoleAccessMaskWithoutCascade(roleMask: Object) {
        if (!roleMask)
            return;

        if (!this.rolesAccessMask) {
            this.rolesAccessMask = {};
        }

        for (let userId in roleMask) {
            this.rolesAccessMask[userId] = roleMask[userId];
        }

    }

    getAccessMaskOnEntity() {
        return null;
    }

    setExcludedUsers(userId: number, isDeclined: boolean) {
        if (!this.excludedUsers) this.excludedUsers = [];
        if (isDeclined) {
            utility.addNumberIfNotExist(userId, this.excludedUsers);
        } else {
            utility.deleteFieldIfExists(userId, this.excludedUsers);
        }
    }
}

export default SecurableEntity;
