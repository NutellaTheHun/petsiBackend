import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidatorBase } from '../../../base/validator-base';
import { ValidationErrorNode } from '../../../util/exceptions/validation-error';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { Recipe, RecipeEntity } from '../entities/recipe.entity';
import { RecipeIngredientValidator } from './recipe-ingredient.validator';

@Injectable()
export class RecipeValidator extends ValidatorBase<RecipeEntity> {
  constructor(
    @InjectRepository(Recipe)
    private readonly repo: Repository<Recipe>,
    @InjectRepository(RecipeCategory)
    private readonly recipeCategoryRepo: Repository<RecipeCategory>,

    private readonly ingredientValidator: RecipeIngredientValidator,

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
    if (await this.helper.exists(this.repo, 'recipeName', dto.recipeName)) {
      const err = new ValidationErrorNode(
        'recipeName',
        id,
        'Recipe with this name already exists.',
      );
      results.push(err);
    }

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

      if (!category.subCategories.find((cat) => cat.id === dto.subCategoryId)) {
        const err = new ValidationErrorNode(
          'subCategory',
          id,
          'Invalid category / subcategory combination',
        );
        results.push(err);
      }
    }

    if (dto.batchResultQuantity && dto.batchResultQuantity <= 0) {
      const err = new ValidationErrorNode(
        'batchResultQuantity',
        id,
        'batch result quantity cannot be 0',
      );
      results.push(err);
    }

    if (dto.salesPrice && dto.salesPrice <= 0) {
      const err = new ValidationErrorNode(
        'salesPrice',
        id,
        'batch result quantity cannot be 0',
      );
      results.push(err);
    }

    if (dto.servingSizeQuantity && dto.servingSizeQuantity <= 0) {
      const err = new ValidationErrorNode(
        'servingSizeQuantity',
        id,
        'batch result quantity cannot be 0',
      );
      results.push(err);
    }

    //check dupliate ingredients
    const seen = new Set<string>();
    if (dto.ingredientDtos && dto.ingredientDtos.length) {
      for (const nestedDto of dto.ingredientDtos) {
        if (!nestedDto.createDto) {
          throw new Error(
            `create recipe validator: nested ingredient is missing create dto`,
          );
        }
        const key = `${nestedDto.createDto.ingredientInventoryItemId ?? 0}: ${nestedDto.createDto.ingredientRecipeId ?? 0}`;
        if (seen.has(key)) {
          const err = new ValidationErrorNode(
            'ingredients',
            id, //missing what particular ingredient
            'duplicate ingredient',
          );
          results.push(err);
        } else {
          seen.add(key);
        }
      }
    }
    if (dto.ingredientDtos && dto.ingredientDtos.length) {
      // nested validator call
      const nestedDtoErrs =
        await this.ingredientValidator.validateManyNestedNode(
          'ingredients',
          dto.ingredientDtos,
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

    if (dto.recipeName) {
      if (await this.helper.exists(this.repo, 'recipeName', dto.recipeName)) {
        const err = new ValidationErrorNode(
          'recipeName',
          id,
          'Recipe with this name already exists.',
        );
        results.push(err);
      }
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

    if (dto.batchResultQuantity && dto.batchResultQuantity <= 0) {
      const err = new ValidationErrorNode(
        'batchResultQuantity',
        id,
        'batch result quantity cannot be 0',
      );
      results.push(err);
    }

    if (dto.salesPrice && dto.salesPrice <= 0) {
      const err = new ValidationErrorNode(
        'salesPrice',
        id,
        'batch result quantity cannot be 0',
      );
      results.push(err);
    }

    if (dto.servingSizeQuantity && dto.servingSizeQuantity <= 0) {
      const err = new ValidationErrorNode(
        'servingSizeQuantity',
        id,
        'batch result quantity cannot be 0',
      );
      results.push(err);
    }

    // check duplicate ingredients
    const itemMap = new Map<string | number, string>();
    const seen = new Set<string>();
    if (dto.ingredientDtos && dto.ingredientDtos.length) {
      const currentRecipe = await this.repo.findOne({
        where: { id },
        relations: [
          'ingredients',
          'ingredients.ingredientInventoryItem',
          'ingredients.ingredientRecipe',
        ],
      });
      if (!currentRecipe) {
        throw new Error(
          `update recipe validator: recipe being updated with id ${id} not found`,
        );
      }

      for (const ingred of currentRecipe.ingredients) {
        itemMap.set(
          ingred.id,
          `${ingred.ingredientInventoryItem?.id ?? 0}: ${ingred.ingredientRecipe?.id ?? 0}`,
        );
      }

      for (const nestedDto of dto.ingredientDtos) {
        if (nestedDto.createDto && nestedDto.createId) {
          itemMap.set(
            nestedDto.createId,
            `${nestedDto.createDto.ingredientInventoryItemId ?? 0}: ${nestedDto.createDto.ingredientRecipeId ?? 0}`,
          );
        } else if (nestedDto.updateDto && nestedDto.id) {
          if (
            nestedDto.updateDto.ingredientInventoryItemId ||
            nestedDto.updateDto.ingredientRecipeId
          ) {
            const currentItem = itemMap.get(nestedDto.id);
            if (!currentItem) {
              throw new Error(`item to update was not found`);
            }
            const newInvIngredId =
              nestedDto.updateDto.ingredientInventoryItemId ??
              currentItem.split(':')[0];
            const newRecIngredId =
              nestedDto.updateDto.ingredientRecipeId ??
              currentItem.split(':')[1];

            itemMap.set(nestedDto.id, `${newInvIngredId}:${newRecIngredId}`);
          }
        }
      }

      for (const val of itemMap.values()) {
        if (seen.has(val)) {
          const err = new ValidationErrorNode(
            'ingredients',
            id, //missing what particular ingredient
            'duplicate ingredient',
          );
          results.push(err);
        } else {
          seen.add(val);
        }
      }

      // nested validator call
      const nestedDtoErrs =
        await this.ingredientValidator.validateManyNestedNode(
          'ingredients',
          dto.ingredientDtos,
        );
      if (nestedDtoErrs) {
        results.push(nestedDtoErrs);
      }
    }

    return this.checkValidateResult(results);
  }
}
