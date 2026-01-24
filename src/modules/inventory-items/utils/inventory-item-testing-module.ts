import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TypeORMPostgresTestingModule } from '../../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { AppLoggingModule } from '../../app-logging/app-logging.module';
import { RequestContextModule } from '../../request-context/request-context.module';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UnitOfMeasureModule } from '../../unit-of-measure/unit-of-measure.module';
import { InventoryItemCategoryController } from '../controllers/inventory-item-category.controller';
import { InventoryItemPackageController } from '../controllers/inventory-item-package.controller';
import { InventoryItemSizeController } from '../controllers/inventory-item-size.controller';
import { InventoryItemVendorController } from '../controllers/inventory-item-vendor.controller';
import { InventoryItemController } from '../controllers/inventory-item.controller';
import { InventoryItemCategory } from '../entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../entities/inventory-item-package.entity';
import { InventoryItemSize } from '../entities/inventory-item-size.entity';
import { InventoryItemVendor } from '../entities/inventory-item-vendor.entity';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryItemsModule } from '../inventory-items.module';
import { InventoryItemCategoryService } from '../services/inventory-item-category.service';
import { InventoryItemPackageService } from '../services/inventory-item-package.service';
import { InventoryItemSizeService } from '../services/inventory-item-size.service';
import { InventoryItemVendorService } from '../services/inventory-item-vendor.service';
import { InventoryItemService } from '../services/inventory-item.service';

export async function getInventoryItemTestingModule(opts?: {
  inventoryItemCategoryServiceClass?: new (
    ...args: any[]
  ) => InventoryItemCategoryService;
  inventoryItemPackageServiceClass?: new (
    ...args: any[]
  ) => InventoryItemPackageService;
  inventoryItemSizeServiceClass?: new (
    ...args: any[]
  ) => InventoryItemSizeService;
  inventoryItemVendorServiceClass?: new (
    ...args: any[]
  ) => InventoryItemVendorService;
  inventoryItemServiceClass?: new (...args: any[]) => InventoryItemService;
}): Promise<TestingModule> {
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
        pinoHttp: { transport: { target: 'pino-pretty' } },
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
  })
    .overrideProvider(RequestContextService)
    .useClass(TestRequestContextService)
    .overrideProvider(InventoryItemCategoryService)
    .useClass(opts?.inventoryItemCategoryServiceClass)
    .overrideProvider(InventoryItemPackageService)
    .useClass(opts?.inventoryItemPackageServiceClass)
    .overrideProvider(InventoryItemSizeService)
    .useClass(opts?.inventoryItemSizeServiceClass)
    .overrideProvider(InventoryItemVendorService)
    .useClass(opts?.inventoryItemVendorServiceClass)
    .overrideProvider(InventoryItemService)
    .useClass(opts?.inventoryItemServiceClass)
    .compile();
}
