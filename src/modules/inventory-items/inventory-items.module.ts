import { Module } from '@nestjs/common';
import { InventoryItemsController } from './controllers/inventory-items.controller';
import { InventoryItemsService } from './services/inventory-items.service';
import { InventoryItem } from './entities/inventory-item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItemCategory } from './entities/inventory-item-category.entity';
import { InventoryItemPackage } from './entities/inventory-item-package.entity';
import { InventoryItemSize } from './entities/inventory-item-size.entity';
import { InventoryItemSizesController } from './controllers/inventory-item-sizes.contoller';
import { InventoryItemCategoriesController } from './controllers/inventory-item-categories.contoller';
import { InventoryItemPackagesController } from './controllers/inventory-item-packages.contoller';
import { InventoryItemVendor } from './entities/inventory-item-vendor.entity';
import { InventoryItemCategoriesService } from './services/inventory-items-categories.service';
import { InventoryItemPackagesService } from './services/inventory-items-packages.service';
import { InventoryItemSizesService } from './services/inventory-items-sizes.service';
import { InventoryItemVendorsService } from './services/inventory-item-vendors.service';

@Module({
  imports: [ 
    TypeOrmModule.forFeature([
      InventoryItem, 
      InventoryItemCategory, 
      InventoryItemPackage, 
      InventoryItemSize,
      InventoryItemVendor,
    ])
  ],

  controllers: [
    InventoryItemsController, 
    InventoryItemCategoriesController, 
    InventoryItemPackagesController, 
    InventoryItemSizesController,
    InventoryItemVendor,
  ],
    
  providers: [
    InventoryItemsService,
    InventoryItemCategoriesService,
    InventoryItemPackagesService,
    InventoryItemSizesService,
    InventoryItemVendorsService,
  ]
})
export class InventoryItemsModule {}
