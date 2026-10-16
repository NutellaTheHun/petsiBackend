import { ValidatorIdentityBaseInterface } from "../../../../common/base/validator-identity.base.interface";

export interface InventoryAreaValidatorIdentity extends ValidatorIdentityBaseInterface {
    name?: string;
    locationId?: number;
    /** Stored locationId on update; undefined on create. */
    existingLocationId?: number;
}