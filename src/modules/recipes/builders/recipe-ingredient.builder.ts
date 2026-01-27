import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { InventoryItem } from '../../inventory-items/entities/inventory-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { NestedCreateRecipeIngredientDto } from '../dto/recipe-ingredient/nested-create-recipe-ingredient.dto';
import { NestedUpdateRecipeIngredientDto } from '../dto/recipe-ingredient/nested-update-recipe-ingedient.dto';
import { UpdateRecipeIngredientDto } from '../dto/recipe-ingredient/update-recipe-ingedient.dto';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { Recipe } from '../entities/recipe.entity';

@Injectable()
export class RecipeIngredientBuilder extends BuilderBase<RecipeIngredient> {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepo: Repository<Recipe>,

    @InjectRepository(RecipeIngredient)
    private readonly ingredientRepo: Repository<RecipeIngredient>,

    @InjectRepository(InventoryItem)
    private readonly itemRepo: Repository<InventoryItem>,

    @InjectRepository(UnitOfMeasure)
    private readonly unitRepo: Repository<UnitOfMeasure>,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(
      RecipeIngredient,
      'RecipeIngredientBuilder',
      requestContextService,
      logger,
    );
  }

  protected createEntity(
    dto: CreateRecipeIngredientDto,
    parent?: Recipe,
  ): void {
    if (dto.ingredientInventoryItemId !== undefined) {
      this.ingredientInventoryItemById(dto.ingredientInventoryItemId);
    }
    if (dto.quantity !== undefined) {
      this.quantity(dto.quantity);
    }
    if (dto.ingredientRecipeId !== undefined) {
      this.ingredientRecipeById(dto.ingredientRecipeId);
    }
    if (dto.quantityUnitTypeId !== undefined) {
      this.quantityUnitOfMeasureById(dto.quantityUnitTypeId);
    }

    // If the parentRecipeId is provided, use it to set the parentRecipe. (Through recipe-ingredient endpoint)
    // If the parentRecipeId is not provided, but a parent is provided, use the parent to set the parentRecipe. (Through create recipe endpoint)
    if (parent) {
      this.setPropByVal('parentRecipe', parent);
    } else if (dto.parentRecipeId !== undefined) {
      this.parentRecipeById(dto.parentRecipeId);
    }
  }

  protected updateEntity(dto: UpdateRecipeIngredientDto): void {
    if (dto.ingredientInventoryItemId !== undefined) {
      this.entity.ingredientRecipe = null;
      this.ingredientInventoryItemById(dto.ingredientInventoryItemId);
    }
    if (dto.quantity !== undefined) {
      this.quantity(dto.quantity);
    }
    if (dto.ingredientRecipeId !== undefined) {
      this.entity.ingredientInventoryItem = null;
      this.ingredientRecipeById(dto.ingredientRecipeId);
    }
    if (dto.quantityUnitTypeId !== undefined) {
      this.quantityUnitOfMeasureById(dto.quantityUnitTypeId);
    }
  }

  /**
   * Handles both create and update recipe ingredient DTOs, for when updating recipes involving new and modified ingredients.
   */
  public async buildMany(
    parent: Recipe,
    dtos: (
      | CreateRecipeIngredientDto
      | NestedCreateRecipeIngredientDto
      | NestedUpdateRecipeIngredientDto
    )[],
  ): Promise<RecipeIngredient[]> {
    const results: RecipeIngredient[] = [];
    for (const dto of dtos) {
      if (dto instanceof CreateRecipeIngredientDto) {
        results.push(await this.buildCreateDto(dto));
      } else {
        if ('createId' in dto) {
          results.push(await this.buildCreateDto(dto, parent, dto.createId));
        }
        if ('id' in dto) {
          const ingred = await this.ingredientRepo.findOne({
            where: { id: dto.id },
          });
          if (!ingred) {
            throw new Error('recipe ingredient not found');
          }
          results.push(await this.buildUpdateDto(ingred, dto));
        }
      }
    }
    return results;
  }

  public parentRecipeById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.recipeRepo.findOne({ where: { id } }),
      'parentRecipe',
      id,
    );
  }

  public parentRecipeByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.recipeRepo.findOne({ where: { name } }),
      'parentRecipe',
      name,
    );
  }

  public ingredientInventoryItemById(id: number | null): this {
    if (id === null) {
      return this.setPropByVal('ingredientInventoryItem', null);
    }
    return this.setPropById(
      async (id: number) => await this.itemRepo.findOne({ where: { id } }),
      'ingredientInventoryItem',
      id,
    );
  }

  public ingredientInventoryItemByName(name: string): this {
    return this.setPropByName(
      async (name: string) => await this.itemRepo.findOne({ where: { name } }),
      'ingredientInventoryItem',
      name,
    );
  }

  public ingredientRecipeById(id: number | null): this {
    if (id === null) {
      return this.setPropByVal('ingredientRecipe', null);
    }
    return this.setPropById(
      async (id: number) => await this.recipeRepo.findOne({ where: { id } }),
      'ingredientRecipe',
      id,
    );
  }

  public ingredientRecipeByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.recipeRepo.findOne({ where: { name } }),
      'ingredientRecipe',
      name,
    );
  }

  public quantity(amount: number): this {
    return this.setPropByVal('quantity', amount);
  }

  public quantityUnitOfMeasureById(id: number): this {
    return this.setPropById(
      async (id: number) => await this.unitRepo.findOne({ where: { id } }),
      'quantityUnitType',
      id,
    );
  }

  public quantityUnitOfMeasureByName(name: string): this {
    return this.setPropByName(
      async (name: string) => await this.unitRepo.findOne({ where: { name } }),
      'quantityUnitType',
      name,
    );
  }
}
