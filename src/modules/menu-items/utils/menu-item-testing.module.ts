import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { MenuItemCategoryController } from "../controllers/menu-item-category.controller";
import { MenuItemSizeController } from "../controllers/menu-item-size.controller";
import { MenuItemController } from "../controllers/menu-item.controller";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemsModule } from "../menu-items.module";
import { MenuItemComponentController } from "../controllers/menu-item-component.controller";
import { MenuItemComponent } from "../entities/menu-item-component.entity";
import { CacheModule } from "@nestjs/cache-manager";
import { LoggerModule } from "nestjs-pino";
import { AppLoggingModule } from "../../app-logging/app-logging.module";
import { RequestContextModule } from "../../request-context/request-context.module";
import { TestRequestContextService } from "../../../util/mocks/test-request-context.service";
import { RequestContextService } from "../../request-context/RequestContextService";
import { ComponentOption } from "../entities/component-option.entity";
import { MenuItemComponentOptions } from "../entities/menu-item-component-options.entity";
import { ComponentOptionController } from "../controllers/component-option.controller";
import { MenuItemComponentOptionsController } from "../controllers/menu-item-component-options.controller";

export async function getMenuItemTestingModule(): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([
                MenuItemCategory,
                MenuItemSize,
                MenuItem,
                MenuItemComponent,
                ComponentOption,
                MenuItemComponentOptions,
            ]),
            TypeOrmModule.forFeature([
                MenuItemCategory,
                MenuItemSize,
                MenuItem,
                MenuItemComponent,
                ComponentOption,
                MenuItemComponentOptions,
            ]),
            MenuItemsModule,
            CacheModule.register(),
            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } }
            }),
            AppLoggingModule,
            RequestContextModule,
        ],

        controllers: [
            MenuItemCategoryController,
            MenuItemSizeController,
            MenuItemController,
            MenuItemComponentController,
            ComponentOptionController,
            MenuItemComponentOptionsController
        ],

        providers: [],
})
.overrideProvider(RequestContextService)
.useClass(TestRequestContextService)
.compile()};