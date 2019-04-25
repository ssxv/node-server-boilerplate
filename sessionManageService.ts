import { RoleEnum } from './securityConfig';
import * as configUtil from './securityConfig';
import { expressJwtFunc } from 'nodedata/security/auth/security-utils';
import { RepoActions } from 'nodedata/core/enums/repo-actions-enum';
import { service } from 'nodedata/di/decorators/service';
import { inject } from 'nodedata/di/decorators/inject';
import * as configUtils from 'nodedata/core/utils';
import * as securityImplCore from 'nodedata/core/dynamic/security-impl';
import { CurrentUser } from './models/common/currentUser';
import { PrincipalContext } from 'nodedata/security/auth/principalContext';
import { SecurityConstant } from './utils/constants/securityConst';
import { UserModel } from './models/security/usermodel';
import * as dataBase from './repositories/security/userRepository';
import * as LoggerService from "./services/common/services/LoggerService";
import * as Enumerable from 'linq';
var jwt = require('jsonwebtoken');
import { config as _config } from './envConfig/envConfig';

@service()
export class SessionManageService {

    @inject(LoggerService)
    static logger: LoggerService.LoggerService;

    @inject(dataBase)
    static userDatabase: dataBase.UserRepository;

    static ensureLoggedIn() {
        return function (req, res, next) {
            if (configUtils.config().Security.isAutheticationEnabled == configUtils.securityConfig().AuthenticationEnabled[configUtils.securityConfig().AuthenticationEnabled.disabled]) {
                next();
            }

            //by token
            if (configUtils.config().Security.authenticationType == configUtils.securityConfig().AuthenticationType[configUtils.securityConfig().AuthenticationType.TokenBased]) {
                var expressJwt = expressJwtFunc();
                let decodedUser = null;
                decodedUser = SessionManageService.getDecodedUser(req);
                if (!decodedUser || !decodedUser.id || !expressJwt) {
                    let userModel = new UserModel();
                    userModel.roles = [RoleEnum[RoleEnum.ROLE_CONSUMER]];
                    let user = new CurrentUser(<any>userModel);
                    PrincipalContext.User = user;
                    return next();
                }
                return SessionManageService.userDatabase.findOne(decodedUser.id).then(user => {
                    if (!user) {
                        res.set("Content-Type", "application/json");
                        res.send(401, JSON.stringify('Invalid request.', null, 4));
                        return;
                    }
                    if (user && user.isDeactivated) {
                        res.set("Content-Type", "application/json");
                        res.send(401, JSON.stringify('User is de-activiated.', null, 4));
                        return;
                    }
                    PrincipalContext.User = new CurrentUser(user);
                    return expressJwt(req, res, next);
                });
            }

            return function (req, res, next) {
                next();
            }
        }
    }

    static getDecodedUser(req) {
        let token = null;
        let decodedUser = null;
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            token = req.query.token;
        } else if (req.cookies && req.cookies.authorization) {
            token = req.cookies.authorization;
        }
        if (!token) {
            return null;
        }
        decodedUser = jwt.verify(token, configUtils.securityConfig().SecurityConfig.tokenSecretkey);
        return decodedUser;
    }

    static isAuthorize(req: any, repository: any, invokedFunction?: string) {

        if (configUtils.config().Security.isAutheticationEnabled === SecurityConstant.Disabled_Authorization) {
            return true;
        }

        // if no action (put, post, del, bulk or 'do' actions) then disallow the request
        if (!invokedFunction)
            return false;

        //check for autherization

        //1. get user object in session
        var userInsession: CurrentUser = <CurrentUser>PrincipalContext.User;

        if (!userInsession)
            return false;

        //2. get roles for current user
        let userRoles: Array<string> = userInsession.getUserRole();

        //3. get resource name for
        var resourceName = repository.path;

        //4. get auth config from security config for current resource
        var authCofig: configUtil.IResourceAccess = <configUtil.IResourceAccess>Enumerable.from(configUtils.securityConfig().SecurityConfig.ResourceAccess)
            .where((resourceAccess: any) => {
                return resourceAccess.name == resourceName
            })
            .firstOrDefault();

        //5. check if the current user has resoruce access rule for current resource
        if (authCofig) {
            if (authCofig.isRepoAuthorize == false) {
                return false;
            }

            var roleWiseResource = Enumerable.from((<any>authCofig).acl)
                .where((acl: any) => userRoles.indexOf(acl.role) >= 0)
                .toArray();
        }

        //6. if current user does not have resource access rule for current resource then check for * (star- means all resource accessibility)
        if (!authCofig || !roleWiseResource || !roleWiseResource.length) {
            let authConfigForAllResources = <configUtil.IResourceAccess>Enumerable.from(configUtils.securityConfig().SecurityConfig.ResourceAccess)
                .where((resourceAccess: any) => {
                    return resourceAccess.name == "*";
                })
                .firstOrDefault();
            //7. application does not have any resource access rule for the current resource, so lets grant access to the resource
            if (!authConfigForAllResources) {
                return true;
            }

            if (authConfigForAllResources.isRepoAuthorize == false) {
                return false;
            }

            var roleWiseResource = Enumerable.from((<any>authConfigForAllResources).acl)
                .where((acl: any) => userRoles.indexOf(acl.role) >= 0)
                .toArray();

            //8. application does not have any resource access rule for the current resource and role, so lets grant access to the resource
            if (!roleWiseResource || !roleWiseResource.length) {
                return true;
            }
        }

        // 9. run the resource acess rule for the current user

        var isAutherize: boolean = false;

        let actionsCreateArry = [RepoActions.post, RepoActions.bulkPost];

        let actionsUpdateArry = [RepoActions.put, RepoActions.patch, RepoActions.bulkPut];

        let actionsDeleteArry = [RepoActions.delete, RepoActions.bulkDel];

        let actionsReadArry = [RepoActions.findAll, RepoActions.findByField, RepoActions.findChild, RepoActions.findMany,
        RepoActions.findOne, RepoActions.findWhere];

        // 10. check create permission
        if (actionsCreateArry.indexOf(invokedFunction) > -1) { // any methods starts from 'do' is write action.

            let rolesForCreate: Array<any> = Enumerable.from(roleWiseResource)
                .where((acl: any) => { return (acl.accessmask & configUtil.AccessMask.CREATE) == configUtil.AccessMask.CREATE; })
                .toArray();
            // match auth config and user roles
            rolesForCreate.forEach(element => {
                if (userRoles.indexOf(element.role) >= 0) {
                    isAutherize = true;
                }
            });
            return isAutherize;
        }

        // 11. check update permission
        if (actionsUpdateArry.indexOf(invokedFunction) > -1) { // any methods starts from 'do' is write action.

            let rolesForWrite: Array<any> = Enumerable.from(roleWiseResource)
                .where((acl: any) => { return (acl.accessmask & configUtil.AccessMask.WRITE) == configUtil.AccessMask.WRITE; })
                .toArray();
            //5 match auth config and user roles
            rolesForWrite.forEach(element => {
                if (userRoles.indexOf(element.role) >= 0) {
                    isAutherize = true;
                }
            });
            return isAutherize;
        }

        // check delete permission
        if (actionsDeleteArry.indexOf(invokedFunction) > -1) { // any methods starts from 'do' is write action.
            let rolesForDelete: Array<any> = Enumerable.from(roleWiseResource)
                .where((acl: any) => { return (acl.accessmask & configUtil.AccessMask.DELETE) == configUtil.AccessMask.DELETE; })
                .toArray();
            //5 match auth config and user roles
            rolesForDelete.forEach(element => {
                if (userRoles.indexOf(element.role) >= 0) {
                    isAutherize = true;
                }
            });
            return isAutherize;
        }

        // check read permission
        if (actionsReadArry.indexOf(invokedFunction) > -1 || invokedFunction.startsWith("do")) {

            var rolesForRead: Array<any> = Enumerable.from(roleWiseResource)
                .where((acl: any) => { return (acl.accessmask & configUtil.AccessMask.READ) == configUtil.AccessMask.READ; })
                .toArray();
            //5 match auth config and user roles
            rolesForRead.forEach(element => {
                if (userRoles.indexOf(element.role) >= 0) {
                    isAutherize = true;
                }
            });
            return isAutherize;
        }

        return false;
    }
}

(<any>securityImplCore).ensureLoggedIn = SessionManageService.ensureLoggedIn;
(<any>securityImplCore).isAuthorize = SessionManageService.isAuthorize;
