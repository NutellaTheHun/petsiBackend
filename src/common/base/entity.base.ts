import { NestedDtoBase } from './nested-dto.base';

export abstract class EntityBase<
  TEntity,
  CDto,
  UDto,
  NDto extends NestedDtoBase<CDto, UDto> = never,
> {
  declare __Entity: TEntity;
  declare __CDto: CDto;
  declare __UDto: UDto;
  declare __NDto: NDto;
}
