import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedCreateRecipeSubCategoryDto } from '../../dto/recipe-sub-category/nested-create-recipe-sub-category.dto';
import { NestedUpdateRecipeSubCategoryDto } from '../../dto/recipe-sub-category/nested-update-recipe-sub-category.dto';
import { UpdateRecipeCategoryDto } from '../../dto/recipe-category/update-recipe-category.dto';
import { RecipeCategory } from '../../entities/recipe-category.entity';
import { RecipeSubCategory } from '../../entities/recipe-sub-category.entity';
import { RecipeSubCategoryChangeDetector } from './recipe-sub-category.change-detector';

type NestedSubCategoryDto = NestedCreateRecipeSubCategoryDto | NestedUpdateRecipeSubCategoryDto;

@Injectable()
export class RecipeCategoryChangeDetector extends ChangeDetectorBase<
  RecipeCategory,
  UpdateRecipeCategoryDto
> {
  constructor(
    private readonly subCategoryChangeDetector: RecipeSubCategoryChangeDetector,
  ) {
    super();
  }

  detect(
    entity: RecipeCategory,
    dto: UpdateRecipeCategoryDto,
  ): ChangeDetectionResult<UpdateRecipeCategoryDto> {
    const patch: MutablePartial<UpdateRecipeCategoryDto> = {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(entity.name, dto.name)) {
      patch.name = dto.name;
      changes.push({ op: 'scalar', path: 'name', previousValue: entity.name, nextValue: dto.name });
    }

    if (dto.subCategories !== undefined) {
      const subPatch = this.detectSubCategories(entity.subCategories ?? [], dto.subCategories);
      if (subPatch.length > 0) {
        patch.subCategories = subPatch;
        changes.push({
          op: 'aggregate',
          path: 'subCategories',
          previousValue: entity.subCategories?.map((s) => s.id) ?? [],
          nextValue: subPatch,
        });
      }
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }

  private detectSubCategories(
    existing: RecipeSubCategory[],
    incoming: NestedSubCategoryDto[],
  ): NestedSubCategoryDto[] {
    const patchDtos: NestedSubCategoryDto[] = [];
    const existingById = new Map<number, RecipeSubCategory>();
    for (const item of existing) {
      existingById.set(item.id, item);
    }
    for (const dto of incoming) {
      if ('createId' in dto) {
        patchDtos.push(dto);
        continue;
      }
      const existingItem = existingById.get(dto.id);
      if (!existingItem) {
        patchDtos.push(dto);
        continue;
      }
      const child = this.subCategoryChangeDetector.detect(existingItem, dto);
      if (child.hasChanges) {
        patchDtos.push(child.patch as NestedUpdateRecipeSubCategoryDto);
      }
    }
    return patchDtos;
  }
}
