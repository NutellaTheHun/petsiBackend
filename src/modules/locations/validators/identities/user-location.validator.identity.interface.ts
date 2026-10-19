import { ValidatorIdentityBaseInterface } from '../../../../common/base/validator-identity.base.interface';

export interface UserLocationValidatorIdentity extends ValidatorIdentityBaseInterface {
    readonly userId?: number;
    readonly locationId?: number;
    /** Stored locationId on update; undefined on create. */
    readonly existingLocationId?: number;
    readonly roleIds?: number[];
}
