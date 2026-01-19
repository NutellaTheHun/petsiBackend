import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../common/base/validator.base';
import { ValidationErrorNode } from '../../../common/validation/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { Recipe, RecipeEntity } from '../entities/recipe.entity';
import { RecipeIngredientPatchValidator } from './patch-validators/recipe-ingredient.patch.validator';
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
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    // Exists
    await this.helper.enforceUnique(
      dto.name,
      this.repo,
      'name',
      results,
      'Recipe with this name already exists.',
      id,
    );

    // subcategory with no category assignment
    if (dto.subCategoryId && !dto.categoryId) {
      const err = new ValidationErrorNode(
        'category',
        id,
        'Requires category if assigning sub-category',
      );
      results.push(err);
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
        results,
        'Invalid category / subcategory combination',
        id,
      );
    }

    // batchResultUnitType and batchResultQuantity are coupled
    this.helper.enforceMutualRequired(
      dto,
      ['batchResultUnitTypeId', 'batchResultQuantity'],
      results,
      'batchResultUnitTypeId and batchResultQuantity must both be populated',
      id,
    );

    // if batchResultQuantity must be positive
    if (dto.batchResultQuantity !== undefined) {
      this.helper.enforcePositive(
        dto.batchResultQuantity,
        'batchResultQuantity',
        results,
        'batch result quantity cannot be 0',
        id,
      );
    }

    // if salesPrice is populated, it must be positive
    if (dto.salesPrice !== undefined) {
      this.helper.enforcePositive(
        dto.salesPrice,
        'salesPrice',
        results,
        'sales price cannot be 0',
        id,
      );
    }

    // servingSizeQuantity and servingSizeUnitTypeId are coupled
    this.helper.enforceMutualRequired(
      dto,
      ['servingSizeQuantity', 'servingSizeUnitTypeId'],
      results,
      'servingSizeQuantity and servingSizeUnitTypeId must both be populated',
      id,
    );

    // if servingSizeQuantity must be positive
    if (dto.servingSizeQuantity !== undefined) {
      this.helper.enforcePositive(
        dto.servingSizeQuantity,
        'servingSizeQuantity',
        results,
        'serving size quantity cannot be 0',
        id,
      );
    }

    if (dto.ingredients?.length) {
      //check dupliate ingredients
      const riValidator = new RecipeIngredientPatchValidator(dto.ingredients);
      riValidator.validateUnique(
        'ingredients',
        results,
        'duplicate ingredient',
        id,
      );

      // nested validator call
      const nestedDtoErrs =
        await this.ingredientValidator.validateManyNestedNode(
          'ingredients',
          dto.ingredients,
        );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }

  protected async doValidateUpdateNode(
    dto: UpdateRecipeDto,
    id?: number,
  ): Promise<ValidationErrorNode[] | null> {
    const results: ValidationErrorNode[] = [];

    if (dto.name !== undefined) {
      await this.helper.enforceUnique(
        dto.name,
        this.repo,
        'name',
        results,
        'Recipe with this name already exists.',
        id,
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
        const err = new ValidationErrorNode(
          'subCategory',
          id,
          'Invalid category / subcategory combination',
        );
        results.push(err);
      }
    }

    if (dto.batchResultQuantity !== undefined) {
      this.helper.enforcePositive(
        dto.batchResultQuantity,
        'batchResultQuantity',
        results,
        'batch result quantity cannot be 0',
        id,
      );
    }

    if (dto.salesPrice !== undefined) {
      this.helper.enforcePositive(
        dto.salesPrice,
        'salesPrice',
        results,
        'sales price cannot be 0',
        id,
      );
    }

    if (dto.ingredients?.length) {
      // check duplicate ingredients
      const currentIngredients = await this.recipeIngredientRepo.find({
        where: { id },
        relations: ['ingredientInventoryItem', 'ingredientRecipe'],
      });
      if (!currentIngredients) {
        throw new NotFoundException();
      }
      const riValidator = new RecipeIngredientPatchValidator(
        dto.ingredients,
        currentIngredients,
      );
      riValidator.validateUnique(
        'ingredients',
        results,
        'duplicate ingredient',
        id,
      );

      // nested validator call
      const nestedDtoErrs =
        await this.ingredientValidator.validateManyNestedNode(
          'ingredients',
          dto.ingredients,
        );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }
}
