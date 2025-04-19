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

    InventoryItemBuilder,
    InventoryItemCategoryBuilder,
    InventoryItemPackageBuilder,
    InventoryItemSizeBuilder,
    InventoryItemVendorBuilder,

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
