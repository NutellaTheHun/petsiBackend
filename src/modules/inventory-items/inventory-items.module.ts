import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { UnitOfMeasureModule } from '../unit-of-measure/unit-of-measure.module';
import { InventoryItemCategoryBuilder } from './builders/inventory-item-category.builder';
import { InventoryItemPackageBuilder } from './builders/inventory-item-package.builder';
import { InventoryItemSizeBuilder } from './builders/inventory-item-size.builder';
import { InventoryItemVendorBuilder } from './builders/inventory-item-vendor.builder';
import { InventoryItemBuilder } from './builders/inventory-item.builder';
import { InventoryItemCategoryController } from './controllers/inventory-item-category.controller';
import { InventoryItemPackageController } from './controllers/inventory-item-package.controller';
import { InventoryItemSizeController } from './controllers/inventory-item-size.controller';
import { InventoryItemVendorController } from './controllers/inventory-item-vendor.controller';
import { InventoryItemController } from './controllers/inventory-item.controller';
import { InventoryItemCategory } from './entities/inventory-item-category.entity';
import { InventoryItemPackage } from './entities/inventory-item-package.entity';
import { InventoryItemSize } from './entities/inventory-item-size.entity';
import { InventoryItemVendor } from './entities/inventory-item-vendor.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryItemCategoryService } from './services/inventory-item-category.service';
import { InventoryItemPackageService } from './services/inventory-item-package.service';
import { InventoryItemSizeService } from './services/inventory-item-size.service';
import { InventoryItemVendorService } from './services/inventory-item-vendor.service';
import { InventoryItemService } from './services/inventory-item.service';
import { InventoryItemTestingUtil } from './utils/inventory-item-testing.util';
import { InventoryItemCategoryValidator } from './validators/inventory-item-category.validator';
import { InventoryItemPackageValidator } from './validators/inventory-item-package.validator';
import { InventoryItemSizeValidator } from './validators/inventory-item-size.validator';
import { InventoryItemVendorValidator } from './validators/inventory-item-vendor.validator';
import { InventoryItemValidator } from './validators/inventory-item.validator';

@Module({
  imports: [ 
    TypeOrmModule.forFeature([
      InventoryItem, 
      InventoryItemCategory, 
      InventoryItemPackage, 
      InventoryItemSize,
      InventoryItemVendor,
    ]),
    
    UnitOfMeasureModule,
    CacheModule.register(),
    AppLoggingModule,
    RequestContextModule,
  ],

  controllers: [
    InventoryItemController, 
    InventoryItemCategoryController, 
    InventoryItemPackageController, 
    InventoryItemSizeController,
    InventoryItemVendorController,
  ],
    
  providers: [
    InventoryItemService,
    InventoryItemCategoryService,
    InventoryItemPackageService,
    InventoryItemSizeService,
    InventoryItemVendorService,

    InventoryItemBuilder,
    InventoryItemCategoryBuilder,
    InventoryItemPackageBuilder,
    InventoryItemSizeBuilder,
    InventoryItemVendorBuilder,

    InventoryItemValidator,
    InventoryItemCategoryValidator,
    InventoryItemPackageValidator,
    InventoryItemSizeValidator,
    InventoryItemVendorValidator,

    InventoryItemTestingUtil
  ],

  exports: [
    InventoryItemService,
    InventoryItemCategoryService,
    InventoryItemPackageService,
    InventoryItemSizeService,
    InventoryItemVendorService,

    InventoryItemSizeBuilder,

    InventoryItemTestingUtil,
  ]
})
export class InventoryItemsModule {}
