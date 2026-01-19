import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { UpdateRecipeIngredientDto } from '../dto/recipe-ingredient/update-recipe-ingedient.dto';
import {
  RecipeIngredient,
  RecipeIngredientEntity,
} from '../entities/recipe-ingredient.entity';

@Injectable()
export class RecipeIngredientValidator extends ValidatorBase<RecipeIngredientEntity> {
  constructor(
    @InjectRepository(RecipeIngredient)
    private readonly repo: Repository<RecipeIngredient>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'RecipeIngredient', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateRecipeIngredientDto,
    id?: string,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Validate only ingredientInventoryItemId or ingredientRecipeId is populated
    this.helper.enforceOnlyOne(
      dto,
      'ingredientInventoryItemId',
      'ingredientRecipeId',
      results,
      'missing reference for ingredient',
      'cannot provide both an inventory item and a recipe as an ingredient',
      id,
    );

    // if ingredient recipe, cannot equal parent
    if (
      dto.ingredientRecipeId &&
      dto.ingredientRecipeId === dto.parentRecipeId
    ) {
      const err = new ValidationErrorNode(
        'ingredientRecipe',
        id,
        'recipe cannot add itself as an ingredient',
      );
      results.push(err);
    }

    // quantity cant be less than equal 0
    this.helper.enforcePositive(
      dto.quantity,
      'quantity',
      results,
      'quantity cannot be 0',
      id,
    );

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateRecipeIngredientDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Validate only one of the two properties are populated
    if (dto.ingredientInventoryItemId && dto.ingredientRecipeId) {
      const err = new ValidationErrorNode(
        'ingredientInventoryItemId',
        id,
        'cannot provide both an inventory item and a recipe as an ingredient',
      );
      results.push(err);
    }

    // if ingredient recipe, cannot equal parent
    if (dto.ingredientRecipeId) {
      const currentRecipe = await this.repo.findOne({
        where: { id },
        relations: ['parentRecipe'],
      });
      if (!currentRecipe) {
        throw new Error(
          `recipe ingredient update: ingredient being updated with id ${id} was not found`,
        );
      }

      if (currentRecipe.parentRecipe.id === dto.ingredientRecipeId) {
        const err = new ValidationErrorNode(
          'ingredientRecipe',
          id,
          'recipe cannot add itself as an ingredient',
        );
        results.push(err);
      }
    }

    // quantity cant be less than equal 0
    this.helper.enforcePositive(
      dto.quantity,
      'quantity',
      results,
      'quantity cannot be 0',
      id,
    );

    return this.checkValidateResult(results);
  }
}
