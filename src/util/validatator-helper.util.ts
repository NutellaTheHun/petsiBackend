import { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { InventoryItemSize } from '../modules/inventory-items/entities/inventory-item-size.entity';
import { MenuItemSize } from '../modules/menu-items/entities/menu-item-size.entity';
import { ValidationErrorNode } from './exceptions/validation-error';

type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number | null | undefined ? K : never;
}[keyof T];

type StringKeys<T> = {
  [K in keyof T]: T[K] extends string | null | undefined ? K : never;
}[keyof T];

type ArrayKeys<T> = {
  [K in keyof T]: T[K] extends Array<any> ? K : never;
}[keyof T];

export class ValidatorHelper<Entity extends ObjectLiteral> {
  /**
   * Validates that the given size is within the list of sizes
   *
   * @param sizeToValidateId The id of either {@link MenuItemSize} or {@link InventoryItemSize }
   *
   * @param sizeList
   * An array of either {@link MenuItemSize} or {@link InventoryItemSize }
   *
   * @returns true if sizeList contains sizeToValidate, false if not found.
   */
  /* public isValidSize(
    sizeToValidateId: number,
    sizeList: MenuItemSize[] | InventoryItemSize[] | number[],
  ): boolean {
    if (
      Array.isArray(sizeList) &&
      sizeList.length > 0 &&
      typeof sizeList[0] === 'number'
    ) {
      return sizeList.some((sizeId) => sizeId === sizeToValidateId);
    }
    return sizeList.some((size) => size.id === sizeToValidateId);
  }*/

  /*public findDuplicates<T>(
    items: T[],
    getCompositeKey: (item: T) => string,
  ): T[] {
    const seen = new Map<string, T[]>();
    const duplicates: T[] = [];

    for (const item of items) {
      const key = getCompositeKey(item);

      if (seen.has(key)) {
        if (seen.get(key)?.length === 1) {
          duplicates.push(item);
          const list = seen.get(key)!;
          list.push(item);
          seen.set(key, list);
        }
      } else {
        seen.set(key, [item]);
      }
    }

    return duplicates;
  }*/

  /* public enforceNotEmpty<
    Entity extends ObjectLiteral,
    Prop extends keyof Entity,
  >(
    val: Entity[Prop],
    prop: Prop,
    errArr: ValidationErrorNode[],
    errMsg: string,
    id?: number | string,
  ): void {
    if (val == null) return;

    if (!val.length) {
      errArr.push(new ValidationErrorNode(String(prop), id, errMsg));
    }
  }*/

  public enforceNotEmpty<Prop extends ArrayKeys<Entity>>(
    val: any[],
    prop: Prop,
    errArr: ValidationErrorNode[],
    errMsg: string,
    id?: number | string,
  ): void {
    if (!val) return;

    if (val.length === 0) {
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
  public enforcePositive<Prop extends NumericKeys<Entity>>(
    val: Entity[Prop],
    prop: Prop,
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
  /*public enforceNonNegative<
    Entity extends ObjectLiteral,
    Prop extends keyof Entity,
  >(
    val: Entity[Prop],
    prop: Prop,
    errArr: ValidationErrorNode[],
    errMsg: string,
    id?: number | string,
  ): void {
    if (val == null) return;

    if (val < 0) {
      errArr.push(new ValidationErrorNode(prop, id, errMsg));
    }
  }*/
  //
  public enforceNonNegative<Prop extends NumericKeys<Entity>>(
    val: Entity[Prop],
    prop: Prop,
    errArr: ValidationErrorNode[],
    errMsg: string,
    id?: number | string,
  ): void {
    if (val == null) return;
    if (val < 0) {
      errArr.push(new ValidationErrorNode(String(prop), id, errMsg));
    }
  }

  public enforceInList<Prop extends ArrayKeys<Entity>>(
    val: string | number,
    list: (string | number)[],
    prop: Prop,
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
   *
   * @param repo repo that is being checked for uniqueness
   * @param prop Name of property being checked for uniqueness
   * @param val value being checked against prop for uniqueness
   * @param errArr array that the resulting error object is pushed to
   * @param errMsg description of error
   * @param id entity that is the source of the error
   */
  public async enforceUnique<Prop extends keyof Entity>(
    val: Entity[Prop],
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
   * Value must be unique to the a list of string elements,
   * Fails if value is found within list.
   * @param list list of strings being checked against
   * @param prop property being checked for uniqueness
   * @param val value being checked against list for uniqueness
   * @param errArr array that resulting error is pushed to
   * @param errMsg message describing error
   * @param id id to entity that is error source
   */
  public async enforceUniqueInArr<Prop extends keyof Entity>(
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
}
