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

@Module({
  imports: [ 
    TypeOrmModule.forFeature([
      InventoryItem, 
      InventoryItemCategory, 
      InventoryItemPackage, 
      InventoryItemSize])],

  controllers: [
    InventoryItemsController, 
    InventoryItemCategoriesController, 
    InventoryItemPackagesController, 
    InventoryItemSizesController, ],
    
  providers: [InventoryItemsService]
})
export class InventoryItemsModule {}
