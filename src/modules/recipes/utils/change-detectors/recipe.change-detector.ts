import { Injectable } from '@nestjs/common';
import {
  ChangeDetectionResult,
  ChangeDetectorBase,
  ChangeDetectorChange,
  MutablePartial,
} from '../../../../common/base/change-detector.base';
import { NestedCreateRecipeIngredientDto } from '../../dto/recipe-ingredient/nested-create-recipe-ingredient.dto';
import { NestedUpdateRecipeIngredientDto } from '../../dto/recipe-ingredient/nested-update-recipe-ingedient.dto';
import { UpdateRecipeDto } from '../../dto/recipe/update-recipe-dto';
import { RecipeIngredient } from '../../entities/recipe-ingredient.entity';
import { Recipe } from '../../entities/recipe.entity';
import { RecipeIngredientChangeDetector } from './recipe-ingredient.change-detector';

type NestedIngredientDto = NestedCreateRecipeIngredientDto | NestedUpdateRecipeIngredientDto;

@Injectable()
export class RecipeChangeDetector extends ChangeDetectorBase<Recipe, UpdateRecipeDto> {
  constructor(
    private readonly recipeIngredientChangeDetector: RecipeIngredientChangeDetector,
  ) {
    super();
  }

  detect(entity: Recipe, dto: UpdateRecipeDto): ChangeDetectionResult<UpdateRecipeDto> {
    const patch: MutablePartial<UpdateRecipeDto> = {};
    const changes: ChangeDetectorChange[] = [];

    if (!this.unchanged(entity.name, dto.name)) {
      patch.name = dto.name;
      changes.push({ path: 'name', previousValue: entity.name, nextValue: dto.name });
    }
    if (!this.unchanged(entity.producedMenuItem?.id ?? null, dto.producedMenuItemId ?? null)) {
      patch.producedMenuItemId = dto.producedMenuItemId;
      changes.push({
        path: 'producedMenuItemId',
        previousValue: entity.producedMenuItem?.id ?? null,
        nextValue: dto.producedMenuItemId ?? null,
      });
    }
    if (!this.unchanged(entity.batchResultQuantity ?? null, dto.batchResultQuantity ?? null)) {
      patch.batchResultQuantity = dto.batchResultQuantity;
      changes.push({
        path: 'batchResultQuantity',
        previousValue: entity.batchResultQuantity ?? null,
        nextValue: dto.batchResultQuantity ?? null,
      });
    }
    if (!this.unchanged(entity.batchResultUnitType?.id ?? null, dto.batchResultUnitTypeId ?? null)) {
      patch.batchResultUnitTypeId = dto.batchResultUnitTypeId;
      changes.push({
        path: 'batchResultUnitTypeId',
        previousValue: entity.batchResultUnitType?.id ?? null,
        nextValue: dto.batchResultUnitTypeId ?? null,
      });
    }
    if (!this.unchanged(entity.servingSizeQuantity ?? null, dto.servingSizeQuantity ?? null)) {
      patch.servingSizeQuantity = dto.servingSizeQuantity;
      changes.push({
        path: 'servingSizeQuantity',
        previousValue: entity.servingSizeQuantity ?? null,
        nextValue: dto.servingSizeQuantity ?? null,
      });
    }
    if (!this.unchanged(entity.servingSizeUnitType?.id ?? null, dto.servingSizeUnitTypeId ?? null)) {
      patch.servingSizeUnitTypeId = dto.servingSizeUnitTypeId;
      changes.push({
        path: 'servingSizeUnitTypeId',
        previousValue: entity.servingSizeUnitType?.id ?? null,
        nextValue: dto.servingSizeUnitTypeId ?? null,
      });
    }
    if (!this.unchanged(entity.salesPrice ? Number(entity.salesPrice) : null, dto.salesPrice ?? null)) {
      patch.salesPrice = dto.salesPrice;
      changes.push({
        path: 'salesPrice',
        previousValue: entity.salesPrice ? Number(entity.salesPrice) : null,
        nextValue: dto.salesPrice ?? null,
      });
    }
    if (!this.unchanged(entity.isIngredient, dto.isIngredient)) {
      patch.isIngredient = dto.isIngredient;
      changes.push({ path: 'isIngredient', previousValue: entity.isIngredient, nextValue: dto.isIngredient });
    }
    if (!this.unchanged(entity.category?.id ?? null, dto.categoryId ?? null)) {
      patch.categoryId = dto.categoryId;
      changes.push({ path: 'categoryId', previousValue: entity.category?.id ?? null, nextValue: dto.categoryId ?? null });
    }
    if (!this.unchanged(entity.subCategory?.id ?? null, dto.subCategoryId ?? null)) {
      patch.subCategoryId = dto.subCategoryId;
      changes.push({
        path: 'subCategoryId',
        previousValue: entity.subCategory?.id ?? null,
        nextValue: dto.subCategoryId ?? null,
      });
    }

    if (dto.ingredients !== undefined) {
      const ingredientPatch = this.detectIngredients(
        entity.ingredients ?? [],
        dto.ingredients,
      );
      if (ingredientPatch.length > 0) {
        patch.ingredients = ingredientPatch;
        changes.push({
          path: 'ingredients',
          previousValue: entity.ingredients?.map((i) => i.id) ?? [],
          nextValue: ingredientPatch,
        });
      }
    }

    return { patch, hasChanges: changes.length > 0, changes };
  }

  private detectIngredients(
    existing: RecipeIngredient[],
    incoming: NestedIngredientDto[],
  ): NestedIngredientDto[] {
    const patchDtos: NestedIngredientDto[] = [];
    const existingById = new Map<number, RecipeIngredient>();
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
      const child = this.recipeIngredientChangeDetector.detect(existingItem, dto);
      if (child.hasChanges) {
        patchDtos.push(child.patch as NestedUpdateRecipeIngredientDto);
      }
    }
    return patchDtos;
  }
}
