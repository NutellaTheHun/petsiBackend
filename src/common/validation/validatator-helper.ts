import { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { ArrayKeys, NumericKeys } from '../types';
import { ValidationErrorNode } from './validation-error';

export class ValidatorHelper<
  TEntity extends ObjectLiteral,
  TDto extends ObjectLiteral,
> {
  /**
   * Array must not be empty
   * @param val any array
   * @param prop array property of entity
   * @param errArr array error is pushed to
   * @param errMsg description of error
   * @param id of target entity
   * @returns nothing
   */
  public enforceNotEmpty<
    DtoProp extends ArrayKeys<TDto>,
    EntityProp extends ArrayKeys<TEntity>,
  >(
    val: TDto[DtoProp] | null | undefined,
    prop: EntityProp,
    errArr: ValidationErrorNode[],
    errMsg: string,
    id?: number | string,
  ): void {
    if (!val || val.length === 0) {
      errArr.push(new ValidationErrorNode(String(prop), id, errMsg));
    }
  }

  /**
   * Value must be greater than 0,
   * Fails if value is less than or equal to 0,
   * VALUE CANNOT EQUAL 0
   * @param val Value being evaluated
   * @param prop corresponding property of entity
   * @param id id of entity holding the property
   * @param errArr array that resulting error is pushed to
   * @param errMsg message detailing the error
   */
  public enforcePositive<
    DtoProp extends NumericKeys<TDto>,
    EntityProp extends keyof TEntity,
  >(
    val: TDto[DtoProp] | null | undefined,
    prop: EntityProp,
    errArr: ValidationErrorNode[],
    errMsg: string,
    id?: number | string,
  ): void {
    if (val == null) return;

    if (val <= 0) {
      errArr.push(new ValidationErrorNode(String(prop), id, errMsg));
    }
  }

  /**
   * Value must be equal to or greater than 0,
   * Fails if value is less than 0,
   * VALUE CAN BE 0
   * @param val Value being evaluated
   * @param prop corresponding property of entity
   * @param id id of entity holding the property
   * @param errArr array that resulting error is pushed to
   * @param errMsg message detailing the error
   */
  public enforceNonNegative<
    DtoProp extends NumericKeys<TDto>,
    EntityProp extends NumericKeys<TEntity>,
  >(
    val: TDto[DtoProp],
    prop: EntityProp,
    errArr: ValidationErrorNode[],
    errMsg: string,
    id?: number | string,
  ): void {
    if (val == null) return;
    if (val < 0) {
      errArr.push(new ValidationErrorNode(String(prop), id, errMsg));
    }
  }

  /**
   * Value must be found in array
   * @param val value to be found in array
   * @param list array to be searched
   * @param prop property the value represents
   * @param errArr array that resulting error is pushed to
   * @param errMsg description of error
   * @param id of source entity
   * @returns
   */
  //Entity extends ObjectLiteral,
  // Prop extends keyof Entity,
  //Prop extends ArrayKeys<Dto>
  public enforceInList<Entity extends ObjectLiteral, Prop extends keyof Entity>(
    val: string | number,
    list: (string | number)[],
    prop: Entity[Prop],
    errArr: ValidationErrorNode[],
    errMsg: string,
    id?: number | string,
  ): void {
    if (val == null) return;

    if (!list.includes(val)) {
      errArr.push(new ValidationErrorNode(String(prop), id, errMsg));
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
   * @param entityId Entity of concern
   * @param foreignEntityId Entity of foreign enttiy containing valid sizes
   * @param sizeId Give Id that must be validated
   * @param foreignRepo repository of entity being validated, can be from a foreign entity
   * @param foreignEntitySizeArrayProp propery of entity contained the list of valid sizes, typically will be from a foreign entity
   * @param errArr array that resulting error is pushed to
   * @param errMsg description of error
   * @param id id of entity (for error messaging)
   * @returns
   */
  public async enforceValidSize<
    ForeignEntity extends ObjectLiteral & { id: number },
  >(
    sizeId: number,
    foreignEntityId: number,
    foreignRepo: Repository<ForeignEntity>,
    foreignEntitySizeArrayProp: ArrayKeys<ForeignEntity>,
    errArr: ValidationErrorNode[],
    errMsg: string,
    id?: number | string,
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

    this.enforceInList(
      sizeId,
      validIds,
      foreignEntitySizeArrayProp as string,
      errArr,
      errMsg,
      id,
    );
  }

  /**
   * Entity with provided value for property must not be found in the database.
   * @param repo repo that is being checked for uniqueness
   * @param prop Name of property being checked for uniqueness
   * @param val value being checked against prop for uniqueness
   * @param errArr array that the resulting error object is pushed to
   * @param errMsg description of error
   * @param id entity that is the source of the error
   */
  public async enforceUnique<
    Entity extends ObjectLiteral,
    Prop extends keyof Entity,
  >(
    val: string | number,
    repo: Repository<Entity>,
    prop: Prop,
    errArr: ValidationErrorNode[],
    errMsg: string,
    id?: number | string,
  ): Promise<void> {
    if (val == null) return;

    const exists = await repo.findOne({
      where: { [prop]: val } as FindOptionsWhere<Entity>,
    });
    if (exists) {
      errArr.push(new ValidationErrorNode(String(prop), id, errMsg));
    }
  }

  /**
   * Value must not be found within the provided array
   * @param list list of strings being checked against
   * @param prop property being checked for uniqueness
   * @param val value being checked against list for uniqueness
   * @param errArr array that resulting error is pushed to
   * @param errMsg message describing error
   * @param id id to entity that is error source
   */
  public async enforceUniqueInArr<Prop extends keyof TEntity>(
    val: string | number,
    list: (string | number)[],
    prop: Prop,
    errArr: ValidationErrorNode[],
    errMsg: string,
    id?: number | string,
  ): Promise<void> {
    if (val == null) return;

    if (list.includes(val)) {
      errArr.push(new ValidationErrorNode(String(prop), id, errMsg));
    }
  }

  /**
   * entity with given value for prop must be found in database.
   * @param repo repo that is being checked for uniqueness
   * @param prop Name of property being checked for uniqueness
   * @param val value being checked against prop for uniqueness
   * @param errArr array that the resulting error object is pushed to
   * @param errMsg description of error
   * @param id entity that is the source of the error
   * @returns
   */
  public async enforceExists<
    Entity extends ObjectLiteral,
    Prop extends keyof Entity,
  >(
    val: string | number,
    repo: Repository<Entity>,
    prop: Prop,
    errArr: ValidationErrorNode[],
    errMsg: string,
    id?: number | string,
  ): Promise<void> {
    if (val == null) return;

    const exists = await repo.findOne({
      where: { [prop]: val } as FindOptionsWhere<Entity>,
    });
    if (!exists) {
      errArr.push(new ValidationErrorNode(String(prop), id, errMsg));
    }
  }

  /**
   * if the hinge property is set to the given hingeValue, dependents must be populated
   * @param dto source DTO
   * @param hinge property of Dto whos state determines the required dependents
   * @param hingeValue the state of the hinge property that requires the dependents
   * @param dependents the properties that must be populated if the hinge is set to the hingeValue
   * @param errArr array that the resulting error object is pushed to
   * @param errMsg description of error
   * @param id entity that is the source of the error
   * @returns
   */
  public enforceConditionalRequired<
    Prop extends keyof TDto,
    Dep extends readonly (keyof TDto)[],
  >(
    dto: TDto,
    hinge: Prop,
    hingeValue: TDto[Prop],
    dependents: Dep,
    errArr: ValidationErrorNode[],
    errMsg: string,
    id?: number | string,
  ): void {
    const currentVal = dto[hinge];

    if (hingeValue === undefined) return;

    if (currentVal === hingeValue) {
      for (const dep of dependents) {
        const val = dto[dep];
        if (val == null || (Array.isArray(val) && val.length === 0)) {
          // Should probably pass the dependent Props, or both, not just hinge
          errArr.push(new ValidationErrorNode(String(dep), id, errMsg));
        }
      }
    }
  }

  /**
   * All properties within mutuals array must all be the same state, either undefined/null or populated.
   * @param dto source DTO
   * @param mutuals array of properties that are grouped together
   * @param errArr array that the resulting error object is pushed to
   * @param errMsg description of error
   * @param id entity that is the source of the error
   * @returns
   */
  public enforceMutualRequired<Dep extends readonly (keyof TDto)[]>(
    dto: TDto,
    mutuals: Dep,
    errArr: ValidationErrorNode[],
    errMsg: string,
    id?: number | string,
  ): void {
    if (mutuals.length < 2) return;

    const hasAny = mutuals.some((prop) => dto[prop] != undefined);
    const hasMissing = mutuals.some((prop) => dto[prop] == undefined);

    if (hasAny && hasMissing) {
      for (const prop of mutuals) {
        errArr.push(new ValidationErrorNode(String(prop), id, errMsg));
      }
    }
  }

  /**
   * Only one of the two given properties must be populated.
   *
   * Cannot both be populated or both be vacant.
   * @param firstProp any prop of dto
   * @param secondProp any prop of dto
   * @param errArr array resulting error is pushed to
   * @param errMsgMissing description of error when both properties are missing
   * @param errMsgPopulated description of error when both props are populated
   * @param id of source entity
   */
  public enforceOnlyOne<Prop extends keyof TDto>(
    dto: TDto,
    firstProp: Prop,
    secondProp: Prop,
    errArr: ValidationErrorNode[],
    errMsgMissing: string,
    errMsgPopulated: string,
    id?: number | string,
  ): void {
    const firstVal = dto[firstProp];
    const secondVal = dto[secondProp];

    if (firstVal && secondVal) {
      errArr.push(
        new ValidationErrorNode(String(firstProp), id, errMsgMissing),
      );
      errArr.push(
        new ValidationErrorNode(String(secondProp), id, errMsgMissing),
      );
    } else if (firstVal == null && secondVal == null) {
      errArr.push(
        new ValidationErrorNode(String(firstProp), id, errMsgPopulated),
      );
      errArr.push(
        new ValidationErrorNode(String(secondProp), id, errMsgPopulated),
      );
    }
  }
}
