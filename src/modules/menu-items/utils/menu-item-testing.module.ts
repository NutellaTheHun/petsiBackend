import { CacheModule } from "@nestjs/cache-manager";
import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "nestjs-pino";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { TestRequestContextService } from "../../../util/mocks/test-request-context.service";
import { AppLoggingModule } from "../../app-logging/app-logging.module";
import { RequestContextModule } from "../../request-context/request-context.module";
import { RequestContextService } from "../../request-context/RequestContextService";
import { MenuItemCategoryController } from "../controllers/menu-item-category.controller";
import { MenuItemContainerItemController } from "../controllers/menu-item-container-item.controller";
import { MenuItemContainerOptionsController } from "../controllers/menu-item-container-options.controller";
import { MenuItemContainerRuleController } from "../controllers/menu-item-container-rule.controller";
import { MenuItemSizeController } from "../controllers/menu-item-size.controller";
import { MenuItemController } from "../controllers/menu-item.controller";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { MenuItemContainerItem } from "../entities/menu-item-container-item.entity";
import { MenuItemContainerOptions } from "../entities/menu-item-container-options.entity";
import { MenuItemContainerRule } from "../entities/menu-item-container-rule.entity";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { MenuItem } from "../entities/menu-item.entity";
import { MenuItemsModule } from "../menu-items.module";

export async function getMenuItemTestingModule(): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([
                MenuItemCategory,
                MenuItemSize,
                MenuItem,
                MenuItemContainerItem,
                MenuItemContainerRule,
                MenuItemContainerOptions,
            ]),
            TypeOrmModule.forFeature([
                MenuItemCategory,
                MenuItemSize,
                MenuItem,
                MenuItemContainerItem,
                MenuItemContainerRule,
                MenuItemContainerOptions,
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
            MenuItemContainerItemController,
            MenuItemContainerRuleController,
            MenuItemContainerOptionsController
        ],

        providers: [],
    })
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .compile()
};