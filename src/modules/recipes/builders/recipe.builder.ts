import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BuilderBase } from '../../../common/base/builder.base';
import { AppLogger } from '../../app-logging/app-logger';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UnitOfMeasure } from '../../unit-of-measure/entities/unit-of-measure.entity';
import { CreateRecipeIngredientDto } from '../dto/recipe-ingredient/create-recipe-ingredient.dto';
import { NestedCreateRecipeIngredientDto } from '../dto/recipe-ingredient/nested-create-recipe-ingredient.dto';
import { NestedUpdateRecipeIngredientDto } from '../dto/recipe-ingredient/nested-update-recipe-ingedient.dto';
import { CreateRecipeDto } from '../dto/recipe/create-recipe.dto';
import { UpdateRecipeDto } from '../dto/recipe/update-recipe-dto';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe } from '../entities/recipe.entity';
import { RecipeIngredientBuilder } from './recipe-ingredient.builder';

@Injectable()
export class RecipeBuilder extends BuilderBase<Recipe> {
  constructor(
    @InjectRepository(RecipeIngredient)
    private readonly ingredientRepo: Repository<RecipeIngredient>,

    @InjectRepository(RecipeCategory)
    private readonly categoryRepo: Repository<RecipeCategory>,

    @InjectRepository(RecipeSubCategory)
    private readonly subCategoryRepo: Repository<RecipeSubCategory>,

    @InjectRepository(UnitOfMeasure)
    private readonly unitRepo: Repository<UnitOfMeasure>,

    @InjectRepository(MenuItem)
    private readonly menuItemRepo: Repository<MenuItem>,

    @Inject(forwardRef(() => RecipeIngredientBuilder))
    private readonly ingredientBuilder: RecipeIngredientBuilder,

    requestContextService: RequestContextService,
    logger: AppLogger,
  ) {
    super(Recipe, 'RecipeBuilder', requestContextService, logger);
  }

  protected createEntity(dto: CreateRecipeDto): void {
    if (dto.batchResultQuantity !== undefined) {
      this.batchResultQuantity(dto.batchResultQuantity);
    }
    if (dto.batchResultUnitTypeId !== undefined) {
      this.batchResultMeasurementById(dto.batchResultUnitTypeId);
    }
    if (dto.categoryId !== undefined) {
      this.categoryById(dto.categoryId);
    }
    if (dto.isIngredient !== undefined) {
      this.isIngredient(dto.isIngredient);
    }
    if (dto.producedMenuItemId !== undefined) {
      this.producedMenuItemById(dto.producedMenuItemId);
    }
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
    if (dto.salesPrice !== undefined) {
      this.salesPrice(dto.salesPrice);
    }
    if (dto.servingSizeQuantity !== undefined) {
      this.servingSizeQuantity(dto.servingSizeQuantity);
    }
    if (dto.servingSizeUnitTypeId !== undefined) {
      this.servingSizeMeasurementById(dto.servingSizeUnitTypeId);
    }
    if (dto.subCategoryId !== undefined) {
      this.subCategoryById(dto.subCategoryId);
    }
    if (dto.ingredients !== undefined) {
      this.ingredientsByBuilder(dto.ingredients);
    }
  }

  protected updateEntity(dto: UpdateRecipeDto): void {
    if (dto.batchResultQuantity !== undefined) {
      this.batchResultQuantity(dto.batchResultQuantity);
    }
    if (dto.batchResultUnitTypeId !== undefined) {
      this.batchResultMeasurementById(dto.batchResultUnitTypeId);
    }
    if (dto.categoryId !== undefined) {
      this.categoryById(dto.categoryId);

      if (dto.subCategoryId === undefined) {
        this.subCategoryById(null);
      }
    }
    if (dto.isIngredient !== undefined) {
      this.isIngredient(dto.isIngredient);
    }
    if (dto.producedMenuItemId !== undefined) {
      this.producedMenuItemById(dto.producedMenuItemId);
    }
    if (dto.name !== undefined) {
      this.name(dto.name);
    }
    if (dto.salesPrice !== undefined) {
      this.salesPrice(dto.salesPrice);
    }
    if (dto.servingSizeQuantity !== undefined) {
      this.servingSizeQuantity(dto.servingSizeQuantity);
    }
    if (dto.servingSizeUnitTypeId !== undefined) {
      this.servingSizeMeasurementById(dto.servingSizeUnitTypeId);
    }
    if (dto.subCategoryId !== undefined) {
      this.subCategoryById(dto.subCategoryId);
    }
    if (dto.ingredients !== undefined) {
      this.ingredientsByBuilder(dto.ingredients);
    }
  }

  public name(name: string): this {
    return this.setPropByVal('name', name);
  }

  public producedMenuItemById(id: number | null): this {
    if (id === null) {
      return this.setPropByVal('producedMenuItem', null);
    }
    return this.setPropById(
      async (id: number) => await this.menuItemRepo.findOne({ where: { id } }),
      'producedMenuItem',
      id,
    );
  }

  public producedMenuItemByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.menuItemRepo.findOne({ where: { name } }),
      'producedMenuItem',
      name,
    );
  }

  public isIngredient(value: boolean): this {
    return this.setPropByVal('isIngredient', value);
  }

  public ingredientsById(ids: number[]): this {
    return this.setPropsByIds(
      async (ids: number[]) =>
        await this.ingredientRepo.find({ where: { id: In(ids) } }),
      'ingredients',
      ids,
    );
  }

  public ingredientsByBuilder(
    dtos: (
      | CreateRecipeIngredientDto
      | NestedCreateRecipeIngredientDto
      | NestedUpdateRecipeIngredientDto
    )[],
  ): this {
    return this.setPropByBuilder(
      this.ingredientBuilder.buildMany.bind(this.ingredientBuilder),
      'ingredients',
      this.entity,
      dtos,
    );
  }

  public batchResultQuantity(amount: number | null): this {
    if (amount === null) {
      return this.setPropByVal('batchResultQuantity', null);
    }
    return this.setPropByVal('batchResultQuantity', amount);
  }

  public batchResultMeasurementById(id: number | null): this {
    if (id === null) {
      return this.setPropByVal('batchResultUnitType', null);
    }
    return this.setPropById(
      async (id: number) => await this.unitRepo.findOne({ where: { id } }),
      'batchResultUnitType',
      id,
    );
  }

  public batchResultMeasurementByName(name: string): this {
    return this.setPropByName(
      async (name: string) => await this.unitRepo.findOne({ where: { name } }),
      'batchResultUnitType',
      name,
    );
  }

  public servingSizeQuantity(amount: number | null): this {
    if (amount === null) {
      return this.setPropByVal('servingSizeQuantity', null);
    }
    return this.setPropByVal('servingSizeQuantity', amount);
  }

  public servingSizeMeasurementById(id: number | null): this {
    if (id === null) {
      return this.setPropByVal('servingSizeUnitType', null);
    }
    return this.setPropById(
      async (id: number) => await this.unitRepo.findOne({ where: { id } }),
      'servingSizeUnitType',
      id,
    );
  }

  public servingSizeMeasurementByName(name: string): this {
    return this.setPropByName(
      async (name: string) => await this.unitRepo.findOne({ where: { name } }),
      'servingSizeUnitType',
      name,
    );
  }

  public salesPrice(amount: number | null): this {
    if (amount === null) {
      return this.setPropByVal('salesPrice', null);
    }
    return this.setPropByVal('salesPrice', String(amount));
  }

  public categoryById(id: number | null): this {
    if (id === null) {
      return this.setPropByVal('category', null);
    }
    return this.setPropById(
      async (id: number) => await this.categoryRepo.findOne({ where: { id } }),
      'category',
      id,
    );
  }

  public categoryByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.categoryRepo.findOne({ where: { name } }),
      'category',
      name,
    );
  }

  public subCategoryById(id: number | null): this {
    if (id === null) {
      return this.setPropByVal('subCategory', null);
    }
    return this.setPropById(
      async (id: number) =>
        await this.subCategoryRepo.findOne({ where: { id } }),
      'subCategory',
      id,
    );
  }

  public subCategoryByName(name: string): this {
    return this.setPropByName(
      async (name: string) =>
        await this.subCategoryRepo.findOne({ where: { name } }),
      'subCategory',
      name,
    );
  }
}
