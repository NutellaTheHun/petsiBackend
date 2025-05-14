import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { InventoryItem } from "../entities/inventory-item.entity";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InventoryItemCategoryController } from "../controllers/inventory-item-category.controller";
import { InventoryItemSizeController } from "../controllers/inventory-item-size.controller";
import { InventoryItemPackageController } from "../controllers/inventory-item-package.controller";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { UnitOfMeasureModule } from "../../unit-of-measure/unit-of-measure.module";
import { InventoryItemController } from "../controllers/inventory-item.controller";
import { InventoryItemVendorController } from "../controllers/inventory-item-vendor.controller";
import { InventoryItemsModule } from "../inventory-items.module";
import { CacheModule } from "@nestjs/cache-manager";
import { LoggerModule } from "nestjs-pino";
import { AppLoggingModule } from "../../app-logging/app-logging.module";
import { RequestContextModule } from "../../request-context/request-context.module";
import { TestRequestContextService } from "../../../util/mocks/test-request-context.service";
import { RequestContextService } from "../../request-context/RequestContextService";

export async function getInventoryItemTestingModule(): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([
                InventoryItem, 
                InventoryItemCategory, 
                InventoryItemPackage, 
                InventoryItemSize,
                InventoryItemVendor,
            ]),
            TypeOrmModule.forFeature([
                InventoryItem, 
                InventoryItemCategory, 
                InventoryItemPackage, 
                InventoryItemSize,
                InventoryItemVendor,
            ]),
            UnitOfMeasureModule,
            InventoryItemsModule,
            CacheModule.register(),
            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } }
            }),
            AppLoggingModule,
            RequestContextModule,
    ],

    controllers: [
        InventoryItemController, 
        InventoryItemCategoryController, 
        InventoryItemSizeController, 
        InventoryItemPackageController,
        InventoryItemVendorController,
    ],

    providers: [],

}).overrideProvider(RequestContextService)
  .useClass(TestRequestContextService)
  .compile()};