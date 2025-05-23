import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { InventoryItemsModule } from '../inventory-items/inventory-items.module';
import { MenuItemsModule } from '../menu-items/menu-items.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { UnitOfMeasureModule } from '../unit-of-measure/unit-of-measure.module';
import { RecipeCategoryBuilder } from './builders/recipe-category.builder';
import { RecipeIngredientBuilder } from './builders/recipe-ingredient.builder';
import { RecipeSubCategoryBuilder } from './builders/recipe-sub-category.builder';
import { RecipeBuilder } from './builders/recipe.builder';
import { RecipeCategoryController } from './controllers/recipe-category.controller';
import { RecipeIngredientController } from './controllers/recipe-ingredient.controller';
import { RecipeSubCategoryController } from './controllers/recipe-sub-category.controller';
import { RecipeController } from './controllers/recipe.controller';
import { RecipeCategory } from './entities/recipe-category.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeSubCategory } from './entities/recipe-sub-category.entity';
import { Recipe } from './entities/recipe.entity';
import { RecipeCategoryService } from './services/recipe-category.service';
import { RecipeIngredientService } from './services/recipe-ingredient.service';
import { RecipeSubCategoryService } from './services/recipe-sub-category.service';
import { RecipeService } from './services/recipe.service';
import { RecipeTestUtil } from './utils/recipe-test.util';
import { RecipeCategoryValidator } from './validators/recipe-category.validator';
import { RecipeIngredientValidator } from './validators/recipe-ingredient.validator';
import { RecipeSubCategoryValidator } from './validators/recipe-sub-category.validator';
import { RecipeValidator } from './validators/recipe.valdiator';

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
        AppLoggingModule,
        RequestContextModule,
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

        RecipeValidator,
        RecipeIngredientValidator,
        RecipeCategoryValidator,
        RecipeSubCategoryValidator,

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
export class RecipesModule { }
