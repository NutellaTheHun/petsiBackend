import { NestedCreateDto } from './nested-create-dto.base';
import { NestedUpdateDto } from './nested-update-dto.base';

export abstract class EntityBase<
  TEntity,
  CDto,
  UDto,
  nCDto extends NestedCreateDto = NestedCreateDto,
  nUDto extends NestedUpdateDto = NestedUpdateDto,
> {
  declare __Entity: TEntity;
  declare __CDto: CDto;
  declare __UDto: UDto;
  declare __NcDto: nCDto;
  declare __NuDto: nUDto;
}
