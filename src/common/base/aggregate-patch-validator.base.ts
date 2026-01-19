import { ValidationErrorNode } from '../validation/validation-error';
import { EntityBase } from './entity.base';
import { NestedCreateDto } from './nested-create-dto.base';
import { NestedUpdateDto } from './nested-update-dto.base';

export abstract class AggregatePatchValidatorBase<
  TEntity extends EntityBase<any, any, any, NestedCreateDto, NestedUpdateDto>,
> {
  protected identities = new Map<string | number, string>();

  protected abstract entityKey(entity: TEntity['__Entity']): string;
  protected abstract createDtoKey(dto: TEntity['__NcDto']): string;
  protected abstract applyUpdateKey(
    entity: TEntity['__Entity'],
    dto: TEntity['__NuDto'],
  ): string;

  constructor(
    dtos: (TEntity['__NcDto'] | TEntity['__NuDto'])[],
    entities?: TEntity['__Entity'][],
  ) {
    if (entities?.length) {
      this.seed(entities);
    }
    for (const dto of dtos) {
      if ('createId' in dto) {
        this.applyCreate(dto.createId, dto);
      } else {
        const entity = entities?.find((e) => e.id === dto.id);
        if (!entity) {
          throw new Error('entity not found');
        }
        this.applyUpdate(dto.id, entity, dto);
      }
    }
  }

  seed(entities: TEntity['__Entity'][]): void {
    for (const entity of entities) {
      this.identities.set((entity as any).id, this.entityKey(entity));
    }
  }

  applyCreate(createId: string, dto: TEntity['__NcDto']): void {
    this.identities.set(createId, this.createDtoKey(dto));
  }

  applyUpdate(
    id: number,
    entity: TEntity['__Entity'],
    dto: TEntity['__NuDto'],
  ): void {
    this.identities.set(id, this.applyUpdateKey(entity, dto));
  }

  validateUnique(
    field: string,
    errArr: ValidationErrorNode[],
    errMsg: string,
    id?: number | string,
  ): void {
    const seen = new Set<string>();
    for (const key of this.identities.values()) {
      if (seen.has(key)) {
        errArr.push(new ValidationErrorNode(field, id, errMsg));
      }
      seen.add(key);
    }
  }
}
