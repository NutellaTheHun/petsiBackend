import { ObjectLiteral } from 'typeorm';

export interface EntityBase<
  TEntity extends ObjectLiteral,
  CDto,
  UDto,
  NDto = never,
> {
  entity: TEntity;
  createDto: CDto;
  updateDto: UDto;
  nestedDto?: NDto;
}
