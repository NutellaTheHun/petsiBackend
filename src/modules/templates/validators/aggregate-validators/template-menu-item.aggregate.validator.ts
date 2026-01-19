import { AggregatePatchValidatorBase } from '../../../../common/base/aggregate-patch-validator.base';
import { ValidationErrorNode } from '../../../../common/validation/validation-error';
import { NestedCreateTemplateMenuItemDto } from '../../dto/template-menu-item/nested-create-template-menu-item.dto';
import { NestedUpdateTemplateMenuItemDto } from '../../dto/template-menu-item/nested-update-template-menu-item.dto';
import {
  TemplateMenuItem,
  TemplateMenuItemEntity,
} from '../../entities/template-menu-item.entity';

export class TemplateMenuItemAggregateValidator extends AggregatePatchValidatorBase<TemplateMenuItemEntity> {
  protected entityKey(entity: TemplateMenuItem): string {
    return this.entityMenuItemKey(entity);
  }
  protected createDtoKey(dto: NestedCreateTemplateMenuItemDto): string {
    return this.dtoMenuItemKey(dto);
  }
  protected applyUpdateKey(
    entity: TemplateMenuItem,
    dto: NestedUpdateTemplateMenuItemDto,
  ): string {
    return this.entityMenuItemKey({
      tablePosIndex: dto.tablePosIndex
        ? dto.tablePosIndex
        : entity.tablePosIndex,
      menuItem: dto.menuItemId ? { id: dto.menuItemId } : entity.menuItem,
    } as any);
  }

  private entityMenuItemKey(entity: TemplateMenuItem): string {
    return `${entity.tablePosIndex}:${entity.menuItem.id}`;
  }
  private dtoMenuItemKey(dto: NestedCreateTemplateMenuItemDto): string {
    return `${dto.tablePosIndex}:${dto.menuItemId}`;
  }

  public enforceUniqueTablePosIndex(
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

  public enforceUniqueMenuItem(
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
