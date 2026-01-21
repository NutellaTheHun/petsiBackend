import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { NestedCreateRecipeIngredientDto } from '../dto/recipe-ingredient/nested-create-recipe-ingredient.dto';
import { NestedUpdateRecipeIngredientDto } from '../dto/recipe-ingredient/nested-update-recipe-ingedient.dto';
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

  protected async doValidateNestedCreateNode(
    dto: NestedCreateRecipeIngredientDto,
    id: string,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // Validate only ingredientInventoryItemId or ingredientRecipeId is populated
    this.helper.enforceOnlyOne(
      dto,
      'ingredientInventoryItemId',
      'ingredientRecipeId',
      errorMap,
      'missing reference for ingredient',
      'cannot provide both an inventory item and a recipe as an ingredient',
    );

    // quantity cant be less than equal 0
    this.helper.enforcePositive(
      dto.quantity,
      'quantity',
      errorMap,
      'quantity cannot be 0',
    );

    return errorMap;
  }

  protected async doValidateCreateNode(
    dto: CreateRecipeIngredientDto,
    id?: string,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // Validate only ingredientInventoryItemId or ingredientRecipeId is populated
    this.helper.enforceOnlyOne(
      dto,
      'ingredientInventoryItemId',
      'ingredientRecipeId',
      errorMap,
      'missing reference for ingredient',
      'cannot provide both an inventory item and a recipe as an ingredient',
    );

    // if ingredient recipe, cannot equal parent
    if (
      dto.ingredientRecipeId &&
      dto.ingredientRecipeId === dto.parentRecipeId
    ) {
      errorMap.addChild(
        'ingredientRecipe',
        new ValidationErrorMap(
          undefined,
          'recipe cannot add itself as an ingredient',
        ),
      );
    }

    // quantity cant be less than equal 0
    this.helper.enforcePositive(
      dto.quantity,
      'quantity',
      errorMap,
      'quantity cannot be 0',
    );

    return errorMap;
  }

  protected async doValidateNestedUpdateNode(
    dto: NestedUpdateRecipeIngredientDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    // Currently no difference in validation between nested update and root update
    return await this.doValidateUpdateNode(
      dto as unknown as UpdateRecipeIngredientDto,
      id,
    );
  }

  protected async doValidateUpdateNode(
    dto: UpdateRecipeIngredientDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // Validate only one of the two properties are populated
    if (dto.ingredientInventoryItemId && dto.ingredientRecipeId) {
      errorMap.addChild(
        'ingredientInventoryItemId',
        new ValidationErrorMap(
          undefined,
          'cannot provide both an inventory item and a recipe as an ingredient',
        ),
      );
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
        errorMap.addChild(
          'ingredientRecipe',
          new ValidationErrorMap(
            undefined,
            'recipe cannot add itself as an ingredient',
          ),
        );
      }
    }

    // quantity cant be less than equal 0
    if (dto.quantity) {
      this.helper.enforcePositive(
        dto.quantity,
        'quantity',
        errorMap,
        'quantity cannot be 0',
      );
    }

    return errorMap;
  }
}
