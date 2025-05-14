import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { InventoryItemsModule } from '../inventory-items/inventory-items.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { InventoryAreaCountBuilder } from './builders/inventory-area-count.builder';
import { InventoryAreaItemBuilder } from './builders/inventory-area-item.builder';
import { InventoryAreaBuilder } from './builders/inventory-area.builder';
import { InventoryAreaCountController } from './controllers/inventory-area-count.controller';
import { InventoryAreaItemController } from './controllers/inventory-area-item.controller';
import { InventoryAreaController } from './controllers/inventory-area.controller';
import { InventoryAreaCount } from './entities/inventory-area-count.entity';
import { InventoryAreaItem } from './entities/inventory-area-item.entity';
import { InventoryArea } from './entities/inventory-area.entity';
import { InventoryAreaCountService } from './services/inventory-area-count.service';
import { InventoryAreaItemService } from './services/inventory-area-item.service';
import { InventoryAreaService } from './services/inventory-area.service';
import { InventoryAreaTestUtil } from './utils/inventory-area-test.util';
import { InventoryAreaCountValidator } from './validators/inventory-area-count.validator';
import { InventoryAreaItemValidator } from './validators/inventory-area-item.validator';
import { InventoryAreaValidator } from './validators/inventory-area.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryArea,
      InventoryAreaCount,
      InventoryAreaItem
    ]),
    InventoryItemsModule,
    CacheModule.register(),
    AppLoggingModule,
    RequestContextModule,
  ],
  controllers: [
    InventoryAreaController,
    InventoryAreaCountController,
    InventoryAreaItemController,
  ],
  providers: [
    InventoryAreaService,
    InventoryAreaCountService,
    InventoryAreaItemService,

    InventoryAreaBuilder,
    InventoryAreaCountBuilder,
    InventoryAreaItemBuilder,

    InventoryAreaValidator,
    InventoryAreaCountValidator,
    InventoryAreaItemValidator,

    InventoryAreaTestUtil,
  ],
  exports: [
    InventoryAreaService,
    InventoryAreaCountService,
    InventoryAreaItemService,

    InventoryAreaTestUtil,
  ]
})
export class InventoryAreasModule {}
