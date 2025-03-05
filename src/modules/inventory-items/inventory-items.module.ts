import { Module } from '@nestjs/common';
import { InventoryItemsController } from './controllers/inventory-items.controller';
import { InventoryItemService } from './services/inventory-item.service';
import { InventoryItem } from './entities/inventory-item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItemCategory } from './entities/inventory-item-category.entity';
import { InventoryItemPackage } from './entities/inventory-item-package.entity';
import { InventoryItemSize } from './entities/inventory-item-size.entity';
import { InventoryItemSizesController } from './controllers/inventory-item-sizes.contoller';
import { InventoryItemCategoriesController } from './controllers/inventory-item-categories.contoller';
import { InventoryItemPackagesController } from './controllers/inventory-item-packages.contoller';
import { InventoryItemVendor } from './entities/inventory-item-vendor.entity';
import { InventoryItemCategoryService } from './services/inventory-item-category.service';
import { InventoryItemPackageService } from './services/inventory-item-package.service';
import { InventoryItemSizeService } from './services/inventory-item-size.service';
import { InventoryItemVendorService } from './services/inventory-item-vendor.service';
import { UnitOfMeasureModule } from '../unit-of-measure/unit-of-measure.module';
import { UnitOfMeasureService } from '../unit-of-measure/services/unit-of-measure.service';

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
    InventoryItemsController, 
    InventoryItemCategoriesController, 
    InventoryItemPackagesController, 
    InventoryItemSizesController,
    InventoryItemVendor,
  ],
    
  providers: [
    InventoryItemService,
    InventoryItemCategoryService,
    InventoryItemPackageService,
    InventoryItemSizeService,
    InventoryItemVendorService,
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
