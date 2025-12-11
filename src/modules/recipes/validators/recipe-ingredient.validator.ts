import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
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

    // no ingredient reference
    if (!dto.ingredientInventoryItemId && !dto.ingredientRecipeId) {
      const err = new ValidationErrorNode(
        'ingredientInventoryItem',
        id,
        'missing reference for ingredient',
      );
      results.push(err);
    }

    // if ingredient recipe, cannot equal parent
    if (dto.ingredientRecipeId === dto.parentRecipeId) {
      const err = new ValidationErrorNode(
        'ingredientRecipe',
        id,
        'recipe cannot add itself as an ingredient',
      );
      results.push(err);
    }

    // quantity cant be less than equal 0
    if (dto.quantity <= 0) {
      const err = new ValidationErrorNode(
        'quantity',
        id,
        'quantity cannot be 0',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateRecipeIngredientDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

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
    if (dto.quantity && dto.quantity <= 0) {
      const err = new ValidationErrorNode(
        'quantity',
        id,
        'quantity cannot be 0',
      );
      results.push(err);
    }

    return this.checkValidateResult(results);
  }
}
