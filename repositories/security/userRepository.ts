import * as decorator from "nodedata/core/decorators/repository";
import { UserModel } from '../../models/security/usermodel';
import { DynamicRepository } from 'nodedata/core/dynamic/dynamic-repository';
import { ExportTypes } from "nodedata/core/constants";

@decorator.repository({ path: 'users', model: UserModel, exportType: ExportTypes.REST })
export class UserRepository extends DynamicRepository {

    constructor() {
        super();
        this.isOnlyCustomActions = true;
    }

}

export default UserRepository;
