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
import { InventoryItemCategoryChangeDetector } from './change-detectors/inventory-item-category.change-detector';
import { InventoryItemPackageChangeDetector } from './change-detectors/inventory-item-package.change-detector';
import { InventoryItemSizeChangeDetector } from './change-detectors/inventory-item-size.change-detector';
import { InventoryItemVendorChangeDetector } from './change-detectors/inventory-item-vendor.change-detector';
import { InventoryItemChangeDetector } from './change-detectors/inventory-item.change-detector';

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
  inventoryItemChangeDetectorClass?: new (...args: any[]) => InventoryItemChangeDetector;
  inventoryItemCategoryChangeDetectorClass?: new (...args: any[]) => InventoryItemCategoryChangeDetector;
  inventoryItemPackageChangeDetectorClass?: new (...args: any[]) => InventoryItemPackageChangeDetector;
  inventoryItemSizeChangeDetectorClass?: new (...args: any[]) => InventoryItemSizeChangeDetector;
  inventoryItemVendorChangeDetectorClass?: new (...args: any[]) => InventoryItemVendorChangeDetector;
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
    .useClass(opts?.inventoryItemCategoryServiceClass ?? InventoryItemCategoryService)
    .overrideProvider(InventoryItemPackageService)
    .useClass(opts?.inventoryItemPackageServiceClass ?? InventoryItemPackageService)
    .overrideProvider(InventoryItemSizeService)
    .useClass(opts?.inventoryItemSizeServiceClass ?? InventoryItemSizeService)
    .overrideProvider(InventoryItemVendorService)
    .useClass(opts?.inventoryItemVendorServiceClass ?? InventoryItemVendorService)
    .overrideProvider(InventoryItemService)
    .useClass(opts?.inventoryItemServiceClass ?? InventoryItemService)
    .overrideProvider(InventoryItemChangeDetector)
    .useClass(opts?.inventoryItemChangeDetectorClass ?? InventoryItemChangeDetector)
    .overrideProvider(InventoryItemCategoryChangeDetector)
    .useClass(opts?.inventoryItemCategoryChangeDetectorClass ?? InventoryItemCategoryChangeDetector)
    .overrideProvider(InventoryItemPackageChangeDetector)
    .useClass(opts?.inventoryItemPackageChangeDetectorClass ?? InventoryItemPackageChangeDetector)
    .overrideProvider(InventoryItemSizeChangeDetector)
    .useClass(opts?.inventoryItemSizeChangeDetectorClass ?? InventoryItemSizeChangeDetector)
    .overrideProvider(InventoryItemVendorChangeDetector)
    .useClass(opts?.inventoryItemVendorChangeDetectorClass ?? InventoryItemVendorChangeDetector)
    .compile();
}
