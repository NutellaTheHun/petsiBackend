import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorMap } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { Recipe, RecipeEntity } from '../entities/recipe.entity';
import { RecipeIngredientAggregateValidator } from './aggregate-validators/recipe-ingredient.aggregate.validator';
import { RecipeIngredientValidator } from './recipe-ingredient.validator';

@Injectable()
export class RecipeValidator extends ValidatorBase<RecipeEntity> {
  constructor(
    @InjectRepository(Recipe)
    private readonly repo: Repository<Recipe>,
    @InjectRepository(RecipeCategory)
    private readonly recipeCategoryRepo: Repository<RecipeCategory>,

    private readonly ingredientValidator: RecipeIngredientValidator,

    @InjectRepository(RecipeIngredient)
    private readonly recipeIngredientRepo: Repository<RecipeIngredient>,

    logger: AppLogger,
    requestContextService: RequestContextService,
  ) {
    super(repo, 'Recipe', requestContextService, logger);
  }

  protected async doValidateCreateNode(
    dto: CreateRecipeDto,
    id?: string,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    // Exists
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      errorMap,
      'Recipe with this name already exists.',
    );

    // subcategory with no category assignment
    if (dto.subCategoryId && !dto.categoryId) {
      errorMap.addChild(
        'category',
        new ValidationErrorMap(
          undefined,
          'Requires category if assigning sub-category',
        ),
      );
    }

    // Validate category / subcategory
    if (dto.categoryId && dto.subCategoryId) {
      const category = await this.recipeCategoryRepo.findOne({
        where: { id: dto.categoryId },
        relations: ['subCategories'],
      });
      if (!category) {
        throw new NotFoundException();
      }

      this.helper.enforceInList(
        dto.subCategoryId,
        category.subCategories.map((cat) => cat.id),
        'subCategory',
        errorMap,
        'Invalid category / subcategory combination',
      );
    }

    // batchResultUnitType and batchResultQuantity are coupled
    this.helper.enforceMutualRequired(
      dto,
      ['batchResultUnitTypeId', 'batchResultQuantity'],
      errorMap,
      'batchResultUnitTypeId and batchResultQuantity must both be populated',
    );

    // if batchResultQuantity must be positive
    if (dto.batchResultQuantity !== undefined) {
      this.helper.enforcePositive(
        dto.batchResultQuantity,
        'batchResultQuantity',
        errorMap,
        'batch result quantity cannot be 0',
      );
    }

    // if salesPrice is populated, it must be positive
    if (dto.salesPrice !== undefined) {
      this.helper.enforcePositive(
        dto.salesPrice,
        'salesPrice',
        errorMap,
        'sales price cannot be 0',
      );
    }

    // servingSizeQuantity and servingSizeUnitTypeId are coupled
    this.helper.enforceMutualRequired(
      dto,
      ['servingSizeQuantity', 'servingSizeUnitTypeId'],
      errorMap,
      'servingSizeQuantity and servingSizeUnitTypeId must both be populated',
    );

    // if servingSizeQuantity must be positive
    if (dto.servingSizeQuantity !== undefined) {
      this.helper.enforcePositive(
        dto.servingSizeQuantity,
        'servingSizeQuantity',
        errorMap,
        'serving size quantity cannot be 0',
      );
    }

    if (dto.ingredients?.length) {
      //check dupliate ingredients
      const riValidator = new RecipeIngredientAggregateValidator(
        dto.ingredients,
      );
      riValidator.validateUnique(
        'ingredients',
        errorMap,
        'duplicate ingredient',
      );

      //check if ingredient is a recipe and validate recipe.isIngredient is true. Else throw error.
      for (const ingredient of dto.ingredients) {
        if (ingredient.ingredientRecipeId) {
          const recipe = await this.repo.findOne({
            where: { id: ingredient.ingredientRecipeId },
          });
          if (!recipe) {
            throw new NotFoundException();
          }
          if (!recipe.isIngredient) {
            errorMap.addChild(
              'ingredients',
              new ValidationErrorMap(
                undefined,
                'this recipe is not set to be an ingredient',
              ),
            );
          }
        }
      }

      // nested validator call
      await this.ingredientValidator.validateManyNestedNode(
        'ingredients',
        dto.ingredients,
        errorMap,
      );
    }

    return errorMap;
  }

  protected async doValidateUpdateNode(
    dto: UpdateRecipeDto,
    id: number,
  ): Promise<ValidationErrorMap> {
    const errorMap = new ValidationErrorMap(id);

    if (dto.name !== undefined) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        errorMap,
        'Recipe with this name already exists.',
      );
    }

    // Validate category / subcategory
    if (dto.categoryId && dto.subCategoryId) {
      const category = await this.recipeCategoryRepo.findOne({
        where: { id: dto.categoryId },
        relations: ['subCategories'],
      });
      if (!category) {
        throw new NotFoundException();
      }

      if (!category.subCategories.find((cat) => cat.id === dto.subCategoryId)) {
        errorMap.addChild(
          'subCategory',
          new ValidationErrorMap(
            undefined,
            'Invalid category / subcategory combination',
          ),
        );
      }
    }

    if (dto.batchResultQuantity !== undefined) {
      this.helper.enforcePositive(
        dto.batchResultQuantity,
        'batchResultQuantity',
        errorMap,
        'batch result quantity cannot be 0',
      );
    }

    if (dto.salesPrice !== undefined) {
      this.helper.enforcePositive(
        dto.salesPrice,
        'salesPrice',
        errorMap,
        'sales price cannot be 0',
      );
    }

    if (dto.ingredients && dto.ingredients?.length) {
      // check duplicate ingredients
      const currentIngredients = await this.recipeIngredientRepo.find({
        where: { id },
        relations: ['ingredientInventoryItem', 'ingredientRecipe'],
      });
      if (!currentIngredients) {
        throw new NotFoundException();
      }
      const riValidator = new RecipeIngredientAggregateValidator(
        dto.ingredients,
        currentIngredients,
      );
      riValidator.validateUnique(
        'ingredients',
        errorMap,
        'duplicate ingredient',
      );

      // nested validator call
      await this.ingredientValidator.validateManyNestedNode(
        'ingredients',
        dto.ingredients,
        errorMap,
      );
    }

    return errorMap;
  }
}
