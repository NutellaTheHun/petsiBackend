import { NestedEntityBase } from "./entity.base";
import { ValidatorIdentityBaseInterface } from "./validator-identity.base.interface";
import { ValidatorBase } from "./validator.base";

export abstract class NestedValidatorBase<T extends NestedEntityBase<any, any, any, any, any>, I extends ValidatorIdentityBaseInterface> extends ValidatorBase<T, I> {
    public abstract resolveIdentity(
        dto: T['__CDto'] | T['__UDto'] | T['__NcDto'] | T['__NuDto'],
        id: number | string,
    ): Promise<I>;
}