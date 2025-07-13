import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationError } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../dto/recipe-ingredient/update-recipe-ingedient.dto';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';

@Injectable()
export class RecipeIngredientValidator extends ValidatorBase<RecipeIngredient> {
  constructor(
    @InjectRepository(RecipeIngredient)
    private readonly repo: Repository<RecipeIngredient>,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'RecipeIngredient', requestContextService, logger);
  }

  public async validateCreate(dto: CreateRecipeIngredientDto): Promise<void> {
    if (dto.ingredientInventoryItemId && dto.ingredientRecipeId) {
      this.addError({
        errorMessage: 'Ingredient references both an inventory item and recipe',
        errorType: 'INVALID',
        contextEntity: 'CreateRecipeIngredientDto',
        sourceEntity: 'InventoryItem',
        sourceId: dto.ingredientInventoryItemId,
        conflictEntity: 'Recipe',
        conflictId: dto.ingredientRecipeId,
      } as ValidationError);
    }
    if (!dto.ingredientInventoryItemId && !dto.ingredientRecipeId) {
      this.addError({
        errorMessage: 'missing reference for ingredient',
        errorType: 'INVALID',
        contextEntity: 'CreateRecipeIngredientDto',
        sourceEntity: 'RecipeIngredient',
      } as ValidationError);
    }
    this.throwIfErrors();
  }

  public async validateUpdate(
    id: number,
    dto: UpdateRecipeIngredientDto,
  ): Promise<void> {
    if (dto.ingredientInventoryItemId && dto.ingredientRecipeId) {
      this.addError({
        errorMessage: 'Ingredient references both an inventory item and recipe',
        errorType: 'INVALID',
        contextEntity: 'UpdateRecipeIngredientDto',
        contextId: id,
        sourceEntity: 'InventoryItem',
        sourceId: dto.ingredientInventoryItemId,
        conflictEntity: 'Recipe',
        conflictId: dto.ingredientRecipeId,
      } as ValidationError);
    } else if (dto.ingredientInventoryItemId || dto.ingredientRecipeId) {
      const currentIngred = await this.repo.findOne({
        where: { id },
        relations: ['ingredientInventoryItem', 'ingredientRecipe'],
      });
      if (!currentIngred) {
        throw new Error();
      }

      if (dto.ingredientInventoryItemId && currentIngred?.ingredientRecipe) {
        if (dto.ingredientRecipeId !== null) {
          this.addError({
            errorMessage:
              'Ingredient currently references a recipe, cannot reference both a inventory item and recipe',
            errorType: 'INVALID',
            contextEntity: 'UpdateRecipeIngredientDto',
            contextId: id,
            sourceEntity: 'InventoryItem',
            sourceId: dto.ingredientInventoryItemId,
            conflictEntity: 'Recipe',
            conflictId: currentIngred.ingredientRecipe.id,
          } as ValidationError);
        }
      }

      if (dto.ingredientRecipeId && currentIngred?.ingredientInventoryItem) {
        if (dto.ingredientInventoryItemId !== null) {
          this.addError({
            errorMessage:
              'Ingredient currently references a inventory item, cannot reference both a inventory item and recipe',
            errorType: 'INVALID',
            contextEntity: 'UpdateRecipeIngredientDto',
            contextId: id,
            sourceEntity: 'Recipe',
            sourceId: dto.ingredientRecipeId,
            conflictEntity: 'InventoryItem',
            conflictId: currentIngred.ingredientInventoryItem.id,
          } as ValidationError);
        }
      }
    }
    this.throwIfErrors();
  }
}
