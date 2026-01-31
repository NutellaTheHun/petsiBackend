import { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { ArrayKeys, NumericKeys } from '../types';
import { ValidationErrorMap } from './validation-error';

export class ValidatorHelper<
    TEntity extends ObjectLiteral,
    TDto extends ObjectLiteral,
> {
    /**
     * Array must not be empty
     * @param arrayVal any array
     * @param field array property of entity
     * @param rootErrMap error map to add error to
     * @param errMsg description of error
     */
    public enforceArrayNotEmpty<
        DtoProp extends ArrayKeys<TDto>,
        EntityProp extends ArrayKeys<TEntity>,
    >(
        arrayVal: TDto[DtoProp] | null | undefined,
        field: EntityProp,
        rootErrMap: ValidationErrorMap,
    ): void {
        if (!arrayVal || arrayVal.length === 0) {
            rootErrMap.addError('MISSING_PROPERTY', undefined, [String(field)]);
        }
    }

    /**
     * Value must be greater than 0,
     * Fails if value is less than or equal to 0,
     * VALUE CANNOT EQUAL 0
     * ignores validation if value is null or undefined
     * @param val Value being evaluated
     * @param field corresponding property of entity
     * @param rootErrMap error map to add error to
     * @param errMsg message detailing the error
     */
    public enforcePositive<
        DtoProp extends NumericKeys<TDto>,
        EntityProp extends keyof TEntity,
    >(
        val: TDto[DtoProp] | null | undefined,
        field: EntityProp,
        rootErrMap: ValidationErrorMap,
    ): void {
        if (val == null) return;

        if (val <= 0) {
            rootErrMap.addError('INVALID_PROPERTY_VALUE', undefined, [String(field)]);
        }
    }

    /**
     * Value must be equal to or greater than 0,
     * Fails if value is less than 0,
     * VALUE CAN BE 0
     * @param val Value being evaluated
     * @param field corresponding property of entity
     * @param rootErrMap error map to add error to
     * @param errMsg message detailing the error
     */
    public enforceNonNegative<
        DtoProp extends NumericKeys<TDto>,
        EntityProp extends NumericKeys<TEntity>,
    >(
        val: TDto[DtoProp],
        field: EntityProp,
        rootErrMap: ValidationErrorMap,
    ): void {
        if (val == null) return;
        if (val < 0) {
            rootErrMap.addError('INVALID_PROPERTY_VALUE', undefined, [String(field)]);
        }
    }

    /**
     * Value must be found in array
     * @param val value to be found in array
     * @param list array to be searched
     * @param prop property the value represents
     * @param rootErrMap error map to add error to
     * @param errMsg description of error
     */
    public enforceValueInList<Entity extends ObjectLiteral, Prop extends keyof Entity>(
        val: string | number | null | undefined,
        list: (string | number)[],
        field: Entity[Prop],
        rootErrMap: ValidationErrorMap,
    ): void {
        if (val == null) return;

        if (!list.includes(val)) {
            rootErrMap.addError('INVALID_PROPERTY_VALUE', undefined, [String(field)]);
        }
    }

    /**
     * Given size ID must be found within the entities list of valid sizes.
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
     * @param errMsg description of error
     * @param id id of the entity being validated
     */
    public async enforceValidSize<
        Entity extends ObjectLiteral,
        Prop extends keyof Entity,
        ForeignEntity extends ObjectLiteral & { id: number },
    >(
        sizeId: number | null | undefined,
        foreignEntityId: number,
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
            throw new Error();
        }

        const sizeArray = entity[foreignEntitySizeArrayProp] as Array<{
            id: number;
        }>;

        const validIds = sizeArray.map((s) => s.id);

        this.enforceValueInList(sizeId, validIds, String(field), rootErrMap);
    }

    /**
     * Entity with provided value for property must not be found in the database.
     * @param repo repo that is being checked for uniqueness
     * @param field Name of property being checked for uniqueness
     * @param val value being checked against prop for uniqueness
     * @param rootErrMap error map to add error to
     * @param errMsg description of error
     */
    public async enforceUnique<
        Entity extends ObjectLiteral,
        Prop extends keyof Entity,
    >(
        val: string | number | null | undefined,
        repo: Repository<Entity>,
        field: Prop,
        rootErrMap: ValidationErrorMap,
    ): Promise<void> {
        if (val == null) return;

        const exists = await repo.findOne({
            where: { [field]: val } as FindOptionsWhere<Entity>,
        });
        if (exists) {
            rootErrMap.addError('ALREADY_EXISTS', undefined, [String(field)]);
        }
    }

    /**
     * Value must not be found within the provided array
     * @param list list of strings being checked against
     * @param prop property being checked for uniqueness
     * @param val value being checked against list for uniqueness
     * @param rootErrMap error map to add error to
     * @param errMsg message describing error
     */
    public async enforceNotInList<Prop extends keyof TEntity>(
        val: string | number | null | undefined,
        list: (string | number)[],
        field: Prop,
        rootErrMap: ValidationErrorMap,
    ): Promise<void> {
        if (val == null) return;

        if (list.includes(val)) {
            rootErrMap.addError('INVALID_PROPERTY_VALUE', undefined, [String(field)]);
        }
    }

    /**
     * Ensures there are no duplicate elements in an array based on a key extractor.
     * A duplicate is determined if the same key is generated for more than one element.
     * @param items Array of items to check for duplicates
     * @param keyExtractor Function that extracts a unique key from each item
     * @param prop Property name for error reporting
     * @param rootErrMap error map to add error to
     * @param errMsg Message describing the error
     */
    public enforceNoDuplicateElements<TItem>(
        items: TItem[] | null | undefined,
        keyExtractor: (item: TItem) => { id: string | number, identity: string | number },
        field: keyof TEntity,
        rootErrMap: ValidationErrorMap,
    ): void {
        if (!items || items.length === 0) return;

        // map where key is the identity that checks for uniqueness, and value is an array of ids that have the same key
        const identityCount = new Map<string | number, (string | number)[]>();

        items.forEach((item) => {
            const { id, identity } = keyExtractor(item);
            const currentCount = identityCount.get(identity) || [];
            currentCount.push(id);
            identityCount.set(identity, currentCount);
        });

        for (const ids of identityCount.values()) {
            if (ids.length > 1) {
                rootErrMap.addError('DUPLICATE_ITEMS', ids, [String(field)]);
            }
        }
    }

    /**
     * if the hinge property is set to the given hingeValue, dependents must be populated
     * @param dto source DTO
     * @param hinge property of Dto whos state determines the required dependents
     * @param hingeValue the state of the hinge property that requires the dependents
     * @param dependents the properties that must be populated if the hinge is set to the hingeValue
     * @param rootErrMap error map to add error to
     * @param errMsg description of error
     */
    public enforceConditionalRequired<
        Prop extends keyof TDto,
        Dep extends readonly (keyof TDto)[],
    >(
        dto: TDto,
        hinge: Prop,
        hingeValue: TDto[Prop],
        dependents: Dep,
        rootErrMap: ValidationErrorMap,
    ): void {
        const currentVal = dto[hinge];

        if (hingeValue === undefined) return;

        if (currentVal === hingeValue) {
            for (const dep of dependents) {
                const val = dto[dep];
                if (val == null || (Array.isArray(val) && val.length === 0)) {
                    // Should probably pass the dependent Props, or both, not just hinge
                    rootErrMap.addError('MISSING_PROPERTY', undefined, [String(dep)]);
                }
            }
        }
    }

    /**
     * All properties within mutuals array must all be the same state, either undefined/null or populated.
     * @param dto source DTO
     * @param mutuals array of properties that are grouped together
     * @param rootErrMap error map to add error to
     * @param errMsg description of error
     */
    public enforceMutualRequired<Dep extends readonly (keyof TDto)[]>(
        dto: TDto,
        mutuals: Dep,
        rootErrMap: ValidationErrorMap,
    ): void {
        if (mutuals.length < 2) return;

        const hasAny = mutuals.some((field) => dto[field] != undefined);
        const hasMissing = mutuals.some((field) => dto[field] == undefined);

        if (hasAny && hasMissing) {
            rootErrMap.addError('INVALID_PROPERTY_VALUE', undefined, [String(mutuals)]);
        }
    }

    /**
     * Only one of the two given properties must be populated.
     * Cannot both be populated or both be vacant.
     * @param firstProp any prop of dto, must match entity property name (the nested dto)
     * @param secondProp any prop of dto, the (id property)
     * @param rootErrMap error map to add error to
     * @param errMsgMissing description of error when both properties are missing
     * @param errMsgPopulated description of error when both props are populated
     */
    public enforceOnlyOne<Prop extends keyof TDto>(
        dto: TDto,
        firstfield: Prop,
        secondfield: Prop,
        rootErrMap: ValidationErrorMap,
    ): void {
        const firstVal = dto[firstfield];
        const secondVal = dto[secondfield];

        if (firstVal && secondVal) {
            rootErrMap.addError('ONLY_ONE', undefined, [String(firstfield), String(secondfield)]);
        }
    }
}
