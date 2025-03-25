import { Test, TestingModule } from "@nestjs/testing";
import { InventoryItemsModule } from "../../inventory-items/inventory-items.module";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { Recipe } from "../entities/recipe.entity";
import { RecipesModule } from "../recipes.module";
import { ConfigModule } from "@nestjs/config";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { TypeOrmModule } from "@nestjs/typeorm";

export async function getRecipeTestingModule(): Promise<TestingModule> {
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
            UnitOfMeasure,
            InventoryItemsModule,
        ],
        controllers: [
            
        ],
        providers: [],
    }).compile()};