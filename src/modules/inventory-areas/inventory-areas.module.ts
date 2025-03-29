import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItemsModule } from '../inventory-items/inventory-items.module';
import { InventoryAreaCountBuilder } from './builders/inventory-area-count.builder';
import { InventoryAreaItemCountBuilder } from './builders/inventory-area-item-count.builder';
import { InventoryAreaBuilder } from './builders/inventory-area.builder';
import { InventoryAreaCountController } from './controllers/inventory-area-count.controller';
import { InventoryAreaItemCountController } from './controllers/inventory-area-item-count.controller';
import { InventoryAreaController } from './controllers/inventory-area.controller';
import { InventoryAreaCount } from './entities/inventory-area-count.entity';
import { InventoryAreaItemCount } from './entities/inventory-area-item-count.entity';
import { InventoryArea } from './entities/inventory-area.entity';
import { InventoryAreaCountService } from './services/inventory-area-count.service';
import { InventoryAreaItemCountService } from './services/inventory-area-item-count.service';
import { InventoryAreaService } from './services/inventory-area.service';
import { InventoryAreaTestUtil } from './utils/inventory-area-test.util';

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

    InventoryAreaBuilder,
    InventoryAreaCountBuilder,
    InventoryAreaItemCountBuilder,

    InventoryAreaTestUtil,
  ],
  exports: [
    InventoryAreaService,
    InventoryAreaCountService,
    InventoryAreaItemCountService,

    InventoryAreaTestUtil,
  ]
})
export class InventoryAreasModule {}
