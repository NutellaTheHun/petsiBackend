import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeCategory } from './entities/recipe-category.entity';
import { RecipeService } from './services/recipe.service';
import { RecipeSubCategory } from './entities/recipe-sub-category.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { UnitOfMeasureModule } from '../unit-of-measure/unit-of-measure.module';
import { InventoryItemsModule } from '../inventory-items/inventory-items.module';
import { MenuItemsModule } from '../menu-items/menu-items.module';
import { RecipeController } from './controllers/recipe.controller';
import { RecipeCategoryController } from './controllers/recipe-category.controller';
import { RecipeSubCategoryController } from './controllers/recipe-sub-category.controller';
import { RecipeIngredientController } from './controllers/recipe-ingredient.controller';
import { RecipeCategoryService } from './services/recipe-category.service';
import { RecipeSubCategoryService } from './services/recipe-sub-category.service';
import { RecipeIngredientService } from './services/recipe-ingredient.service';
import { RecipeBuilder } from './builders/recipe.builder';
import { RecipeIngredientBuilder } from './builders/recipe-ingredient.builder';
import { RecipeCategoryBuilder } from './builders/recipe-category.builder';
import { RecipeSubCategoryBuilder } from './builders/recipe-sub-category.builder';
import { RecipeTestUtil } from './utils/recipe-test.util';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recipe,
      RecipeCategory,
      RecipeSubCategory,
      RecipeIngredient
    ]),
    UnitOfMeasureModule,
    InventoryItemsModule,
    MenuItemsModule,
    CacheModule.register(),
    LoggerModule,
  ],
  controllers: [
    RecipeController,
    RecipeCategoryController,
    RecipeSubCategoryController,
    RecipeIngredientController
  ],
  providers: [
    RecipeService,
    RecipeCategoryService,
    RecipeSubCategoryService,
    RecipeIngredientService,

    RecipeBuilder,
    RecipeIngredientBuilder,
    RecipeCategoryBuilder,
    RecipeSubCategoryBuilder,

    RecipeTestUtil,
  ],
  exports: [
    RecipeService,
    RecipeCategoryService,
    RecipeSubCategoryService,
    RecipeIngredientService,

    RecipeTestUtil,
  ],
})
export class RecipesModule {}
