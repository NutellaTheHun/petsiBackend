import { Module } from '@nestjs/common';
import { InventoryAreasController } from './inventory-areas.controller';
import { InventoryAreasService } from './inventory-areas.service';

@Module({
  controllers: [InventoryAreasController],
  providers: [InventoryAreasService]
})
export class InventoryAreasModule {}
