import { Module } from '@nestjs/common';
import { InventoryItemController } from './controllers/inventory-item.controller';
import { InventoryItemService } from './services/inventory-item.service';
import { InventoryItem } from './entities/inventory-item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItemCategory } from './entities/inventory-item-category.entity';
import { InventoryItemPackage } from './entities/inventory-item-package.entity';
import { InventoryItemSize } from './entities/inventory-item-size.entity';
import { InventoryItemSizeController } from './controllers/inventory-item-size.controller';
import { InventoryItemCategoryController } from './controllers/inventory-item-category.controller';
import { InventoryItemPackageController } from './controllers/inventory-item-package.controller';
import { InventoryItemVendor } from './entities/inventory-item-vendor.entity';
import { InventoryItemCategoryService } from './services/inventory-item-category.service';
import { InventoryItemPackageService } from './services/inventory-item-package.service';
import { InventoryItemSizeService } from './services/inventory-item-size.service';
import { InventoryItemVendorService } from './services/inventory-item-vendor.service';
import { UnitOfMeasureModule } from '../unit-of-measure/unit-of-measure.module';
import { InventoryItemFactory } from './factories/inventory-item.factory';
import { InventoryItemCategoryFactory } from './factories/inventory-item-category.factory';
import { InventoryItemPackageFactory } from './factories/inventory-item-package.factory';
import { InventoryItemSizeFactory } from './factories/inventory-item-size.factory';
import { InventoryItemVendorFactory } from './factories/inventory-item-vendor.factory';
import { InventoryItemVendorController } from './controllers/inventory-item-vendor.controller';
import { InventoryItemBuilder } from './builders/inventory-item.builder';
import { InventoryItemCategoryBuilder } from './builders/inventory-item-category.builder';
import { InventoryItemPackageBuilder } from './builders/inventory-item-package.builder';
import { InventoryItemSizeBuilder } from './builders/inventory-item-size.builder';
import { InventoryItemVendorBuilder } from './builders/inventory-item-vendor.builder';
import { InventoryItemTestingUtil } from './utils/inventory-item-testing.util';

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

    InventoryItemFactory,
    InventoryItemCategoryFactory,
    InventoryItemPackageFactory,
    InventoryItemSizeFactory,
    InventoryItemVendorFactory,

    InventoryItemController, 
    InventoryItemCategoryController, 
    InventoryItemPackageController, 
    InventoryItemSizeController,
    InventoryItemVendorController,

    InventoryItemBuilder,
    InventoryItemCategoryBuilder,
    InventoryItemPackageBuilder,
    InventoryItemSizeBuilder,
    InventoryItemVendorBuilder,

    InventoryItemTestingUtil
  ],

  exports: [
    InventoryItemSizeController,

    InventoryItemService,
    InventoryItemCategoryService,
    InventoryItemPackageService,
    InventoryItemSizeService,
    InventoryItemVendorService,
  ]
})
export class InventoryItemsModule {}
