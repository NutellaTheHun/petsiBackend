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
import { MenuItemsModule } from "../../menu-items/menu-items.module";
import { CacheModule } from "@nestjs/cache-manager";
import { LoggerModule } from "nestjs-pino";
import { AppLoggingModule } from "../../app-logging/app-logging.module";
import { RequestContextModule } from "../../request-context/request-context.module";
import { TestRequestContextService } from "../../../util/mocks/test-request-context.service";
import { RequestContextService } from "../../request-context/RequestContextService";

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
.compile()};