
import * as decorator from "nodedata/core/decorators/repository";
import { RoleModel } from '../../models/security/rolemodel';

@decorator.repository({ path: 'roles', model: RoleModel })
export default class RoleRepository {

}
