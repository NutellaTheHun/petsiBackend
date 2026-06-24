import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TypeORMPostgresTestingModule } from '../../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { AppLoggingModule } from '../../app-logging/app-logging.module';
import { InventoryItemsModule } from '../../inventory-items/inventory-items.module';
import { MenuItemsModule } from '../../menu-items/menu-items.module';
import { RequestContextModule } from '../../request-context/request-context.module';
import { RequestContextService } from '../../request-context/RequestContextService';
import { RecipeCategory } from '../entities/recipe-category.entity';
import { RecipeIngredient } from '../entities/recipe-ingredient.entity';
import { RecipeSubCategory } from '../entities/recipe-sub-category.entity';
import { Recipe } from '../entities/recipe.entity';
import { RecipesModule } from '../recipes.module';
import { RecipeCategoryService } from '../services/recipe-category.service';
import { RecipeIngredientService } from '../services/recipe-ingredient.service';
import { RecipeSubCategoryService } from '../services/recipe-sub-category.service';
import { RecipeService } from '../services/recipe.service';
import { RecipeCategoryChangeDetector } from './change-detectors/recipe-category.change-detector';
import { RecipeIngredientChangeDetector } from './change-detectors/recipe-ingredient.change-detector';
import { RecipeSubCategoryChangeDetector } from './change-detectors/recipe-sub-category.change-detector';
import { RecipeChangeDetector } from './change-detectors/recipe.change-detector';

export async function getRecipeTestingModule(opts?: {
  recipeServiceClass?: new (...args: any[]) => RecipeService;
  recipeIngredientServiceClass?: new (
    ...args: any[]
  ) => RecipeIngredientService;
  recipeCategoryServiceClass?: new (...args: any[]) => RecipeCategoryService;
  recipeSubCategoryServiceClass?: new (
    ...args: any[]
  ) => RecipeSubCategoryService;
  recipeChangeDetectorClass?: new (...args: any[]) => RecipeChangeDetector;
  recipeIngredientChangeDetectorClass?: new (...args: any[]) => RecipeIngredientChangeDetector;
  recipeCategoryChangeDetectorClass?: new (...args: any[]) => RecipeCategoryChangeDetector;
  recipeSubCategoryChangeDetectorClass?: new (...args: any[]) => RecipeSubCategoryChangeDetector;
}): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      TypeORMPostgresTestingModule([
        Recipe,
        RecipeIngredient,
        RecipeCategory,
        RecipeSubCategory,
      ]),
      TypeOrmModule.forFeature([
        Recipe,
        RecipeIngredient,
        RecipeCategory,
        RecipeSubCategory,
      ]),
      RecipesModule,
      InventoryItemsModule,
      MenuItemsModule,
      CacheModule.register(),
      LoggerModule.forRoot({
        pinoHttp: { transport: { target: 'pino-pretty' } },
      }),
      AppLoggingModule,
      RequestContextModule,
    ],
    controllers: [],
    providers: [],
  })
    .overrideProvider(RequestContextService)
    .useClass(TestRequestContextService)
    .overrideProvider(RecipeService)
    .useClass(opts?.recipeServiceClass || RecipeService)
    .overrideProvider(RecipeIngredientService)
    .useClass(opts?.recipeIngredientServiceClass || RecipeIngredientService)
    .overrideProvider(RecipeCategoryService)
    .useClass(opts?.recipeCategoryServiceClass || RecipeCategoryService)
    .overrideProvider(RecipeSubCategoryService)
    .useClass(opts?.recipeSubCategoryServiceClass || RecipeSubCategoryService)
    .overrideProvider(RecipeChangeDetector)
    .useClass(opts?.recipeChangeDetectorClass || RecipeChangeDetector)
    .overrideProvider(RecipeIngredientChangeDetector)
    .useClass(opts?.recipeIngredientChangeDetectorClass || RecipeIngredientChangeDetector)
    .overrideProvider(RecipeCategoryChangeDetector)
    .useClass(opts?.recipeCategoryChangeDetectorClass || RecipeCategoryChangeDetector)
    .overrideProvider(RecipeSubCategoryChangeDetector)
    .useClass(opts?.recipeSubCategoryChangeDetectorClass || RecipeSubCategoryChangeDetector)
    .compile();
}
