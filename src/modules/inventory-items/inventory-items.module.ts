import { Module } from '@nestjs/common';
import { InventoryItemController } from './controllers/inventory-item.controller';
import { InventoryItemService } from './services/inventory-item.service';
import { InventoryItem } from './entities/inventory-item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItemCategory } from './entities/inventory-item-category.entity';
import { InventoryItemPackage } from './entities/inventory-item-package.entity';
import { InventoryItemSize } from './entities/inventory-item-size.entity';
import { InventoryItemSizeController } from './controllers/inventory-item-sizes.contoller';
import { InventoryItemCategoryController } from './controllers/inventory-item-categories.contoller';
import { InventoryItemPackageController } from './controllers/inventory-item-packages.contoller';
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
  ],

  exports: [
    InventoryItemService,
    InventoryItemCategoryService,
    InventoryItemPackageService,
    InventoryItemSizeService,
    InventoryItemVendorService,
  ]
})
export class InventoryItemsModule {}
