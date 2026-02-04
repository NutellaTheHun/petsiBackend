import { ValidationErrorMap } from '../validation/validation-error';
import { NestedEntityBase } from './entity.base';
import { NestedCreateDto } from './nested-create-dto.base';
import { NestedUpdateDto } from './nested-update-dto.base';
import { ValidatorIdentityBaseInterface } from './validator-identity.base.interface';

export abstract class AggregateValidatorBase<
    TEntity extends NestedEntityBase<any, any, any, NestedCreateDto, NestedUpdateDto>,
    TIdentity extends ValidatorIdentityBaseInterface,
> {
    protected identities = new Map<string | number, string>();

    protected abstract entityKey(entity: TEntity['__Entity']): string;
    protected abstract createIdentityKey(identity: TIdentity): string;
    protected abstract applyUpdateKey(
        entity: TEntity['__Entity'],
        identity: TIdentity,
    ): string;

    constructor(
        identities: TIdentity[],
        entities?: TEntity['__Entity'][],
    ) {
        if (entities?.length) {
            this.seed(entities);
        }
        for (const identity of identities) {
            if (identity.createId) {
                this.applyCreate(identity.createId, identity);
            } else {
                if (!identity.id) {
                    throw new Error('identity id is required');
                }
                const entity = entities?.find((e) => e.id === identity.id);
                if (!entity) {
                    throw new Error('entity not found');
                }
                this.applyUpdate(identity.id, entity, identity);
            }
        }
    }

    seed(entities: TEntity['__Entity'][]): void {
        for (const entity of entities) {
            this.identities.set((entity as any).id, this.entityKey(entity));
        }
    }

    applyCreate(createId: string, identity: TIdentity): void {
        this.identities.set(createId, this.createIdentityKey(identity));
    }

    applyUpdate(
        id: number,
        entity: TEntity['__Entity'],
        identity: TIdentity,
    ): void {
        this.identities.set(id, this.applyUpdateKey(entity, identity));
    }

    validateUnique(
        field: string,
        rootErrMap: ValidationErrorMap,
    ): void {
        // mappping of key to id.
        const seen = new Map<string, (string | number)[]>();
        for (const [id, key] of this.identities) {
            const existingIds = seen.get(key) || [];
            existingIds.push(id);
            seen.set(key, existingIds);
        }
        for (const [key, ids] of seen) {
            if (ids.length > 1) {
                rootErrMap.addError('DUPLICATE_ITEMS', ids, [field]);
            }
        }
    }
}
