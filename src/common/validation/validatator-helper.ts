import { FindOptionsWhere, In, ObjectLiteral, Repository } from 'typeorm';
import { ValidatorIdentityBaseInterface } from '../base/validator-identity.base.interface';
import { ArrayKeys, NumericKeys } from '../types';
import { ValidationErrorMap } from './validation-error';

export class ValidatorHelper<
    TEntity extends ObjectLiteral,
    TIdentity extends ValidatorIdentityBaseInterface,
> {
    /**
     * Array must not be empty. Returns 'MISSING_PROPERTY' error.
     * @param arrayVal any array
     * @param field array property of entity
     * @param rootErrMap error map to add error to
     */
    public enforceArrayNotEmpty<
        DtoProp extends ArrayKeys<TIdentity>,
        EntityProp extends ArrayKeys<TEntity>,
    >(
        arrayVal: TIdentity[DtoProp] | null | undefined,
        field: EntityProp,
        rootErrMap: ValidationErrorMap,
    ): void {
        if (!arrayVal || (Array.isArray(arrayVal) && arrayVal.length === 0)) {
            rootErrMap.addError('MISSING_PROPERTY', undefined, [String(field)]);
        }
    }

    /**
     * Entity with provided id must exist in the database. Returns 'REFERENCE_NOT_FOUND' error,
     * with the id as log-only context, if not found.
     * @param id id of the entity
     * @param repo repository of the entity
     * @param field property of the entity
     * @param rootErrMap error map to add error to
     */
    public async enforceExists<
        Entity extends ObjectLiteral,
        Prop extends keyof TEntity,
    >(
        id: number,
        repo: Repository<Entity>,
        field: Prop,
        rootErrMap: ValidationErrorMap,
    ): Promise<void> {
        const exists = await repo.findOne({
            where: { id } as unknown as FindOptionsWhere<Entity>,
        });
        if (!exists) {
            rootErrMap.addError(
                'REFERENCE_NOT_FOUND',
                undefined,
                [String(field)],
                { value: id },
            );
        }
    }

    /**
     * Property of the referenced entity must be equal to the target value. Returns 'INVALID_REFERENCE' error if not equal,
     * or 'REFERENCE_NOT_FOUND' if the entity doesn't exist. Both carry the id as log-only context.
     * @param id id of the entity
     * @param field property of the entity
     * @param targetValue target value of the property
     * @param repo repository of the entity
     * @param rootErrMap error map to add error to
     */
    public async enforcePropertyState<
        Entity extends ObjectLiteral,
        Prop extends keyof Entity,
    >(
        id: number,
        field: Prop,
        targetValue: string | number | null | undefined,
        repo: Repository<Entity>,
        rootErrMap: ValidationErrorMap,
    ): Promise<void> {
        if (id == null) return;

        const entity = await repo.findOne({
            where: { id } as unknown as FindOptionsWhere<Entity>,
        });
        if (!entity) {
            rootErrMap.addError(
                'REFERENCE_NOT_FOUND',
                undefined,
                [String(field)],
                { value: id },
            );
            return;
        }

        if (entity[field] !== targetValue) {
            rootErrMap.addError(
                'INVALID_REFERENCE',
                undefined,
                [String(field)],
                { value: id },
            );
        }
    }

    /**
     * Value must be greater than 0. Returns 'OUT_OF_RANGE' error if not greater than 0.
     * Fails if value is less than or equal to 0,
     * VALUE CANNOT EQUAL 0
     * ignores validation if value is null or undefined
     * @param val Value being evaluated
     * @param field corresponding property of entity
     * @param rootErrMap error map to add error to
     */
    public enforcePositive<
        DtoProp extends NumericKeys<TIdentity>,
        EntityProp extends keyof TEntity,
    >(
        val: TIdentity[DtoProp],
        field: EntityProp,
        rootErrMap: ValidationErrorMap,
    ): void {
        if (val == null) return;

        if ((val as number) <= 0) {
            rootErrMap.addError('OUT_OF_RANGE', undefined, [String(field)]);
        }
    }

    /**
     * Value must be equal to or greater than 0. Returns 'OUT_OF_RANGE' error if less than 0.
     * Fails if value is less than 0,
     * VALUE CAN BE 0
     * @param val Value being evaluated
     * @param field corresponding property of entity
     * @param rootErrMap error map to add error to
     */
    public enforceNonNegative<
        DtoProp extends NumericKeys<TIdentity>,
        EntityProp extends NumericKeys<TEntity>,
    >(
        val: TIdentity[DtoProp],
        field: EntityProp,
        rootErrMap: ValidationErrorMap,
    ): void {
        if (val == null) return;
        if ((val as number) < 0) {
            rootErrMap.addError('OUT_OF_RANGE', undefined, [String(field)]);
        }
    }

    /**
     * An update may not change a field. Returns 'IMMUTABLE_FIELD' when both
     * values are present and differ; skipped on create (no existing value)
     * or when the update omits the field.
     * @param existing value currently stored on the entity
     * @param next value the update would set
     * @param field corresponding property of entity
     * @param rootErrMap error map to add error to
     */
    public enforceUnchanged<EntityProp extends keyof TEntity>(
        existing: unknown,
        next: unknown,
        field: EntityProp,
        rootErrMap: ValidationErrorMap,
    ): void {
        if (existing == null || next == null) return;
        if (existing !== next) {
            rootErrMap.addError('IMMUTABLE_FIELD', undefined, [String(field)]);
        }
    }

    /**
     * Value must be found in array. Returns 'INCONSISTENT_STATE' error if not found.
     * @param val value to be found in array
     * @param list array to be searched
     * @param prop property the value represents
     * @param rootErrMap error map to add error to
     */
    public enforceValueInList<
        Entity extends ObjectLiteral,
        Prop extends keyof Entity,
    >(
        val: string | number | null | undefined,
        list: (string | number)[],
        field: Entity[Prop],
        rootErrMap: ValidationErrorMap,
    ): void {
        if (val == null) return;

        if (!list.includes(val)) {
            rootErrMap.addError('INCONSISTENT_STATE', undefined, [
                String(field),
            ]);
        }
    }

    /**
     * Given size ID must be found within the entities list of valid sizes.
     * Returns 'INVALID_REFERENCE' error (size id as log-only context) if not found.
     * Returns 'REFERENCE_NOT_FOUND' on the same field (foreign entity id as log-only context) if the foreign entity doesn't exist.
     *
     * List of sizes to validate from will come from a foreign entity
     *
     * example:
     *
     * validating size of an OrderMenuItem must get list of valid sizes from the MenuItem entity
     *
     * @param sizeId Give Id that must be validated
     * @param foreignEntityId Entity of foreign enttiy containing valid sizes
     * @param foreignRepo repository of entity being validated, can be from a foreign entity
     * @param foreignEntitySizeArrayProp propery of entity contained the list of valid sizes, typically will be from a foreign entity
     * @param field property of entity being validated
     * @param rootErrMap error map to add error to
     * @param id id of the entity being validated
     */
    public async enforceValidSize<
        Entity extends ObjectLiteral,
        Prop extends keyof Entity,
        ForeignEntity extends ObjectLiteral & { id: number },
    >(
        sizeId: number | null | undefined,
        foreignEntityId: number | null | undefined,
        foreignRepo: Repository<ForeignEntity>,
        foreignEntitySizeArrayProp: ArrayKeys<ForeignEntity>,
        field: Prop,
        rootErrMap: ValidationErrorMap,
    ): Promise<void> {
        if (sizeId == null) return;

        const entity = await foreignRepo.findOne({
            where: { id: foreignEntityId } as FindOptionsWhere<ForeignEntity>,
            relations: [foreignEntitySizeArrayProp as string],
        });
        if (!entity) {
            rootErrMap.addError(
                'REFERENCE_NOT_FOUND',
                undefined,
                [String(field)],
                {
                    value: foreignEntityId as number,
                },
            );
            return;
        }

        const sizeArray = entity[foreignEntitySizeArrayProp] as Array<{
            id: number;
        }>;

        if (!sizeArray.some((s) => s.id === sizeId)) {
            rootErrMap.addError(
                'INVALID_REFERENCE',
                undefined,
                [String(field)],
                { value: sizeId },
            );
        }
    }

    /**
     * Every nested item upserted by `id` must be an existing child of the parent being validated.
     * Errors go on the item's own child map under `field` (keyed by the nested id), on its `id` field,
     * with the nested id as log-only context:
     * - 'REFERENCE_NOT_FOUND' when no row has that id, or the row is in another tenant
     *   (another tenant's data is never confirmed to exist).
     * - 'INVALID_REFERENCE' when the row exists but belongs to a different parent. On create
     *   (`parentId` isn't a number) there is no parent yet, so any nested id is invalid.
     *
     * Items with only a `createId` are skipped.
     * @param items nested identities of the collection (or a single nested child wrapped in an array)
     * @param parentId id of the entity being validated; a string ('root' or a createId) on create
     * @param childRepo repository of the nested entity
     * @param parentRelation relation on the nested entity that points at its parent
     * @param tenantId caller's tenant; when undefined the tenant check is skipped
     * @param field property of the parent entity holding the nested collection
     * @param rootErrMap error map to add errors to
     */
    public async enforceNestedOwnership<
        Child extends ObjectLiteral & { id: number; tenantId: number },
    >(
        items: ValidatorIdentityBaseInterface[] | null | undefined,
        parentId: number | string | undefined,
        childRepo: Repository<Child>,
        parentRelation: keyof Child & string,
        tenantId: number | undefined,
        field: keyof TEntity,
        rootErrMap: ValidationErrorMap,
    ): Promise<void> {
        const ids = (items ?? [])
            .map((item) => item.id)
            .filter((id): id is number => id != null);
        if (ids.length === 0) return;

        // loadRelationIds replaces the relation with the raw parent id
        const rows = await childRepo.find({
            where: { id: In(ids) } as unknown as FindOptionsWhere<Child>,
            loadEagerRelations: false,
            loadRelationIds: { relations: [parentRelation] },
        });
        const byId = new Map(rows.map((row) => [row.id, row]));

        for (const id of ids) {
            const row = byId.get(id);
            let code: 'REFERENCE_NOT_FOUND' | 'INVALID_REFERENCE' | undefined;
            if (!row || (tenantId != null && row.tenantId !== tenantId)) {
                code = 'REFERENCE_NOT_FOUND';
            } else if (
                typeof parentId !== 'number' ||
                (row[parentRelation] as unknown) !== parentId
            ) {
                code = 'INVALID_REFERENCE';
            }
            if (!code) continue;

            const childErrMap = new ValidationErrorMap(id);
            childErrMap.addError(code, undefined, ['id'], { value: id });
            rootErrMap.addChild(String(field), childErrMap);
        }
    }

    /**
     * Entity with provided value for property must not be found in the database. Returns 'ALREADY_EXISTS' error.
     * @param repo repo that is being checked for uniqueness
     * @param field Name of property being checked for uniqueness
     * @param val value being checked against prop for uniqueness
     * @param rootErrMap error map to add error to
     */
    public async enforceUnique<
        Entity extends ObjectLiteral,
        Prop extends keyof Entity,
    >(
        val: string | number | null | undefined,
        repo: Repository<Entity>,
        field: Prop,
        rootErrMap: ValidationErrorMap,
        id?: number | string,
        scope?: Partial<Entity>,
    ): Promise<void> {
        if (val == null) return;

        const exists = await repo.find({
            where: { [field]: val, ...scope } as FindOptionsWhere<Entity>,
        });
        if (exists && exists.length > 0) {
            // if the id is the same as the existing id, not a validation error, createIds are strings and will always fail this check.
            for (const exist of exists) {
                if (exist.id !== id) {
                    rootErrMap.addError('ALREADY_EXISTS', undefined, [
                        String(field),
                    ]);
                    break;
                }
            }
        }
    }

    /**
     * Value must not be found within the provided array. Returns 'CONFLICTING_VALUES' error if found.
     * @param list list of strings being checked against
     * @param prop property being checked for uniqueness
     * @param val value being checked against list for uniqueness
     * @param rootErrMap error map to add error to
     */
    public enforceNotInList<Prop extends keyof TEntity>(
        val: string | number | null | undefined,
        list: (string | number)[],
        field: Prop,
        rootErrMap: ValidationErrorMap,
    ): void {
        if (val == null) return;

        if (list.includes(val)) {
            rootErrMap.addError('CONFLICTING_VALUES', undefined, [
                String(field),
            ]);
        }
    }

    /**
     * Ensures there are no duplicate elements in an array based on a key extractor. Returns 'DUPLICATE_ITEMS' error.
     * A duplicate is determined if the same key is generated for more than one element.
     * @param items Array of items to check for duplicates
     * @param keyExtractor Function that extracts a unique key from each item
     * @param prop Property name for error reporting
     * @param rootErrMap error map to add error to
     */
    public enforceNoDuplicateElements<TItem>(
        items: TItem[] | null | undefined,
        keyExtractor: (item: TItem) => {
            id: string | number | undefined;
            identity: string | number;
        },
        field: keyof TEntity,
        rootErrMap: ValidationErrorMap,
    ): void {
        if (!items || items.length === 0) return;

        // map where key is the identity that checks for uniqueness, and value is an array of ids that have the same key
        const identityCount = new Map<string | number, (string | number)[]>();

        items.forEach((item) => {
            const { id, identity } = keyExtractor(item);
            if (id == null) throw new Error('id is required');
            const duplicatesOfIds = identityCount.get(identity) || [];
            duplicatesOfIds.push(id);
            identityCount.set(identity, duplicatesOfIds);
        });

        for (const ids of identityCount.values()) {
            if (ids.length > 1) {
                rootErrMap.addError('DUPLICATE_ITEMS', ids, [String(field)]);
            }
        }
    }

    /**
     * if the hinge property is set to the given hingeValue, dependents must be populated. Returns 'MISSING_PROPERTY' error if dependents are not populated.
     * @param identity source DTO
     * @param hinge property of Dto whos state determines the required dependents
     * @param hingeValue the state of the hinge property that requires the dependents
     * @param dependents the properties that must be populated if the hinge is set to the hingeValue
     * @param rootErrMap error map to add error to
     */
    public enforceConditionalRequired<
        Prop extends keyof TIdentity,
        Dep extends readonly (keyof TIdentity)[],
    >(
        identity: TIdentity,
        hinge: Prop,
        hingeValue: TIdentity[Prop],
        dependents: Dep,
        rootErrMap: ValidationErrorMap,
    ): void {
        const currentVal = identity[hinge];

        if (hingeValue === undefined) return;

        if (currentVal === hingeValue) {
            for (const dep of dependents) {
                const val = identity[dep];
                if (val == null || (Array.isArray(val) && val.length === 0)) {
                    // Should probably pass the dependent Props, or both, not just hinge
                    rootErrMap.addError('MISSING_PROPERTY', undefined, [
                        String(dep),
                    ]);
                }
            }
        }
    }

    /**
     * All properties within mutuals array must all be the same state, either undefined/null or populated. Returns 'CONFLICTING_VALUES' error.
     * @param dto source DTO
     * @param mutuals array of properties that are grouped together
     * @param rootErrMap error map to add error to
     */
    public enforceMutualRequired<Dep extends readonly (keyof TIdentity)[]>(
        dto: TIdentity,
        mutuals: Dep,
        rootErrMap: ValidationErrorMap,
    ): void {
        if (mutuals.length < 2) return;

        const hasAny = mutuals.some((field) => dto[field] != undefined);
        const hasMissing = mutuals.some((field) => dto[field] == undefined);

        if (hasAny && hasMissing) {
            rootErrMap.addError('CONFLICTING_VALUES', undefined, [
                ...mutuals.map((field) => String(field)),
            ]);
        }
    }

    /**
     * Only one of the two given properties must be populated. Returns 'INCONSISTENT_STATE' error.
     * Cannot both be populated or both be vacant.
     * @param firstProp any prop of dto, must match entity property name (the nested dto)
     * @param secondProp any prop of dto, the (id property)
     * @param rootErrMap error map to add error to
     */
    public enforceOnlyOne<Prop extends keyof TIdentity>(
        identity: TIdentity,
        firstfield: Prop,
        secondfield: Prop,
        rootErrMap: ValidationErrorMap,
    ): void {
        const firstVal = identity[firstfield];
        const secondVal = identity[secondfield];

        if (firstVal && secondVal) {
            rootErrMap.addError('INCONSISTENT_STATE', undefined, [
                String(firstfield),
                String(secondfield),
            ]);
        }
        if (!firstVal && !secondVal) {
            rootErrMap.addError('INCONSISTENT_STATE', undefined, [
                String(firstfield),
                String(secondfield),
            ]);
        }
    }
}
