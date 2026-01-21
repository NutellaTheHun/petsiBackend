import { AggregateValidatorBase } from '../../../../common/base/aggregate-validator.base';
import { ValidationErrorMap } from '../../../../common/validation/validation-error';
import { NestedCreateTemplateMenuItemDto } from '../../dto/template-menu-item/nested-create-template-menu-item.dto';
import { NestedUpdateTemplateMenuItemDto } from '../../dto/template-menu-item/nested-update-template-menu-item.dto';
import {
  TemplateMenuItem,
  TemplateMenuItemEntity,
} from '../../entities/template-menu-item.entity';

export class TemplateMenuItemAggregateValidator extends AggregateValidatorBase<TemplateMenuItemEntity> {
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
      tablePosIndex: dto.tablePosIndex ?? entity.tablePosIndex,
      menuItem: dto.menuItemId ? { id: dto.menuItemId } : entity.menuItem,
    } as any);
  }

  private entityMenuItemKey(entity: TemplateMenuItem): string {
    return `${entity.tablePosIndex}:${entity.menuItem.id}`;
  }
  private dtoMenuItemKey(dto: NestedCreateTemplateMenuItemDto): string {
    return `${dto.tablePosIndex}:${dto.menuItemId}`;
  }

  /**
   * Validates that no template menu items have the same table position index.
   * If they do, returns an error with the id of the first duplicate.
   * Currently doesnt provide the pair of duplicates.
   * @param field field that holds a list of entities to check for uniqueness
   * @param errMap error map to add error to
   * @param errMsg error description for frontend to display
   */
  public enforceUniqueTablePosIndex(
    field: string,
    errMap: ValidationErrorMap,
    errMsg: string,
  ): void {
    const seen = new Set<string>();
    for (const [id, key] of this.identities) {
      if (seen.has(key)) {
        errMap.addChild(field, new ValidationErrorMap(id, errMsg));
      }
      seen.add(key);
    }
  }

  /**
   * Validates that no template menu items have the same menu item.
   * If they do, returns an error with the id of the first duplicate.
   * Currently doesnt provide the pair of duplicates.
   * @param field field that holds a list of entities to check for uniqueness
   * @param errMap error map to add error to
   * @param errMsg error description for frontend to display
   */
  public enforceUniqueMenuItem(
    field: string,
    errMap: ValidationErrorMap,
    errMsg: string,
  ): void {
    const seen = new Set<string>();
    for (const [id, key] of this.identities) {
      if (seen.has(key)) {
        errMap.addChild(field, new ValidationErrorMap(id, errMsg));
      }
      seen.add(key);
    }
  }
}
