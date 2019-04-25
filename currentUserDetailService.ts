import Q = require('q');
import { service } from 'nodedata/di/decorators/service';
import { UserDetails } from 'nodedata/security/auth/user-details';
import { User } from 'nodedata/security/auth/user';
import { config as _config } from './envConfig/envConfig';
import { inject } from 'nodedata/di/decorators/inject';
import UserRepository from './repositories/security/userRepository';
import { UserDetailService } from 'nodedata/security/auth/user-detail-service';

@service({ 'singleton': true, 'serviceName': 'UserDetailService' })
export class CurrentUserDetailService implements UserDetailService {

    @inject()
    userRepo: UserRepository;

    loadUserByUsername(userName: string): Q.Promise<any> {
        var userDetail: UserDetails;
        return this.userRepo.findByField("email", userName).then((user) => {
            if (user == null || user == undefined || !user._id) {
                throw 'User does not exist.';
            }
            if (!user.isVerified) throw 'Cannot login, as the user is not verified. Please verify yourself, by clicking on the verification link sent to your email.';
            if (user.isDeactivated) throw "Cannot login, as the user is deactivated. Please contact Admin.";
            userDetail = new User(user.email, user.password, user);
            return userDetail;
        });
    };

    loadUserById(id: any): Q.Promise<any> {
        var userDetail: UserDetails;
        var _id: string = id;
        return this.userRepo.findOne(_id).then((user) => {
            if (user == null || user == undefined || !user._id) {
                throw 'user doesnot exist';
            }
            userDetail = new User(user.email, user.password, user);
            return userDetail;
        });
    };

    loadUserByField(field: any, value: any): Q.Promise<any> {
        var userDetail: UserDetails;
        return this.userRepo.findByField(field, value).then((user) => {
            if (user == null || user == undefined) {
                throw 'user doesnot exist';
            }
            userDetail = new User(user.email, user.password, user);
            return userDetail;
        });
    };

    createNewUser(userObject): Q.Promise<any> {
        var userDetail: UserDetails;
        return this.userRepo.post(userObject).then((user) => {
            if (user == null || user == undefined || !user._id) {
                throw 'user doesnot exist';
            }
            userDetail = new User(user.email, user.password, user);
            return userDetail;
        });
    };

    updateExistingUser(id, userObject): Q.Promise<any> {
        var userDetail: UserDetails;
        delete userObject.roles;
        return this.userRepo.patch(id, userObject).then((user) => {
            if (user == null || user == undefined || !user._id) {
                throw 'user doesnot exist';
            }
            userDetail = new User(user.firstName, user.password, user);
            return userDetail;
        });
    }

    getNewUser(req, res) {
    }

    getCurrentUser(sessionId): Q.Promise<any> {
        return Q.when(true);
    }

    verifyUser(req, res) {
    }

    resendToken(req, res) {
    }

    forgotPasswordRequest(req, res) {
    }

    forgotPassword(req, res) {
    }

    resetPassword(req, res) {
    }
}
