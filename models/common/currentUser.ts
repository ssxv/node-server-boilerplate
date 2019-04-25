import { User } from 'nodedata/security/auth/user';
import { UserModel } from '../security/usermodel';

export class CurrentUser extends User {

    private _user: UserModel;
    private _sessionId: string;

    database: any;
    companyName: string;
    userId: string;
    viewContext: number;

    constructor(user: User) {
        let userName = user['name'] ? user['name'] : " ";
        let password = " ";
        super(userName, password, user);
        if (user && (<any>user)['_id']) {
            this.userId = (<any>user)['_id'].toString();
        }
    }

    public initialize() {
    }

    public getSessionId(): string {
        return this._sessionId;
    }

    public getUserRole(): Array<string> {
        return this.getUserObject() && this.getUserObject().roles;
    }

    public getMail() {
        return this.getUserObject() && this.getUserObject().email;
    }

    public getFirstName() {
        return this.getUserObject() && this.getUserObject().name;
    }

    public getLastName() {
        return this.getUserObject() && this.getUserObject().lastName;
    }

    public getPhone() {
        return this.getUserObject() && this.getUserObject().phone;
    }
}
