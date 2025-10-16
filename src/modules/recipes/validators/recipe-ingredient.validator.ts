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

    if (!dto.ingredientInventoryItemId && !dto.ingredientRecipeId) {
      const err = new ValidationErrorNode(
        'ingredientInventoryItem',
        id,
        'missing reference for ingredient',
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

    return this.checkValidateResult(results);
  }
}
