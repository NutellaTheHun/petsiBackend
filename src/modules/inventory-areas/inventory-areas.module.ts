import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryArea } from './entities/inventory-area.entity';
import { InventoryAreaCount } from './entities/inventory-area-count.entity';
import { InventoryAreaItemCount } from './entities/inventory-area-item-count.entity';
import { InventoryItemsModule } from '../inventory-items/inventory-items.module';
import { InventoryAreaCountController } from './controllers/inventory-area-count.controller';
import { InventoryAreaItemCountController } from './controllers/inventory-area-item-count.controller';
import { InventoryAreaController } from './controllers/inventory-area.controller';
import { InventoryAreaService } from './services/inventory-area.service';
import { InventoryAreaCountService } from './services/inventory-area-count.service';
import { InventoryAreaItemCountService } from './services/inventory-area-item-count.service';
import { InventoryAreaFactory } from './factories/inventory-area.factory';
import { InventoryAreaCountFactory } from './factories/inventory-area-count.factory';
import { InventoryAreaItemCountFactory } from './factories/inventory-area-item-count.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryArea,
      InventoryAreaCount,
      InventoryAreaItemCount
    ]),
    InventoryItemsModule
  ],
  controllers: [
    InventoryAreaController,
    InventoryAreaCountController,
    InventoryAreaItemCountController,
  ],
  providers: [
    InventoryAreaService,
    InventoryAreaCountService,
    InventoryAreaItemCountService,
    InventoryAreaFactory,
    InventoryAreaCountFactory,
    InventoryAreaItemCountFactory,
  ],
  exports: [
    InventoryAreaService,
    InventoryAreaCountService,
    InventoryAreaItemCountService
  ]
})
export class InventoryAreasModule {}
