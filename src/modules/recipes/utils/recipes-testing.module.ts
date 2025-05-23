import { CacheModule } from "@nestjs/cache-manager";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "nestjs-pino";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { TestRequestContextService } from "../../../util/mocks/test-request-context.service";
import { AppLoggingModule } from "../../app-logging/app-logging.module";
import { InventoryItemsModule } from "../../inventory-items/inventory-items.module";
import { MenuItemsModule } from "../../menu-items/menu-items.module";
import { RequestContextModule } from "../../request-context/request-context.module";
import { RequestContextService } from "../../request-context/RequestContextService";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";
import { RecipeCategory } from "../entities/recipe-category.entity";
import { RecipeIngredient } from "../entities/recipe-ingredient.entity";
import { RecipeSubCategory } from "../entities/recipe-sub-category.entity";
import { Recipe } from "../entities/recipe.entity";
import { RecipesModule } from "../recipes.module";

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
            MenuItemsModule,
            CacheModule.register(),
            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } }
            }),
            AppLoggingModule,
            RequestContextModule,
        ],
        controllers: [

        ],
        providers: [],
    })
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .compile()
};