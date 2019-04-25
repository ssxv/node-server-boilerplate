export class SecurityConfig {
    public static ResourceAccess: any = [
    ];

    public static tokenSecretkey: string = 'yektercesnekot';
    public static tokenExpiresInMinutes: number = 200000000;
    public static verificationTokenExpiry: number = 3600;
    public static passwordResetTokenExpiry: number = 3600;

    public static isUser: string = "accounts.examplesoft.com";
    public static audience: string = "yoursite.net";
}

export enum AccessMask {
    READ = 1,
    WRITE = 2,
    CREATE = 4,
    DELETE = 8,
    PUBLISH = 16,
    UNPUBLISH = 32
};

export enum PermissionGroupAccess {
    P_AUTHOR = AccessMask.READ + AccessMask.WRITE + AccessMask.PUBLISH + AccessMask.DELETE + AccessMask.CREATE + AccessMask.UNPUBLISH,
    P_READ = AccessMask.READ,
    P_READWRITE = AccessMask.READ + AccessMask.WRITE,
    P_READWRITEDEL = AccessMask.READ + AccessMask.WRITE + AccessMask.DELETE
}

export enum RoleEnum {
    ROLE_CONSUMER = 1,
    ROLE_SUPPLIER_ADMIN,
    ROLE_ADMIN
};

export enum AuthenticationType {
    passwordBased = 1,
    TokenBased = 2
};

export enum AuthenticationEnabled {
    disabled = 1,
    enabledWithoutAuthorization = 2,
    enabledWithAuthorization = 3
};

export interface IResourceAccess {
    name: string;
    acl: Array<Object>;
    isRepoAuthorize: boolean;
}
