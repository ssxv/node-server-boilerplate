import { Strict } from 'nodedata/mongoose/enums';
import { field, document } from 'nodedata/mongoose/decorators';

export interface RoleInterface {
    _id: string;
    name: string;
}

@document({ name: 'roles', strict: Strict.false })
export class RoleModel {

    @field({ primary: true, autogenerated: true })
    _id: any;

    @field()
    name: any;

    constructor(roleDto: RoleInterface) {
        this._id = roleDto._id;
        this.name = roleDto.name;
    }
}

export default RoleModel;
