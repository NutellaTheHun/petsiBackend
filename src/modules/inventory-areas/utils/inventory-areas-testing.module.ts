import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { InventoryItemsModule } from "../../inventory-items/inventory-items.module";
import { InventoryAreaCountController } from "../controllers/inventory-area-count.controller";
import { InventoryAreaItemCountController } from "../controllers/inventory-area-item-count.controller";
import { InventoryAreaController } from "../controllers/inventory-area.controller";
import { InventoryAreaCount } from "../entities/inventory-area-count.entity";
import { InventoryAreaItemCount } from "../entities/inventory-area-item-count.entity";
import { InventoryArea } from "../entities/inventory-area.entity";
import { InventoryAreasModule } from "../inventory-areas.module";

export async function getInventoryAreasTestingModule(): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([
                InventoryArea,
                InventoryAreaCount,
                InventoryAreaItemCount,
            ]),
            TypeOrmModule.forFeature([
                InventoryArea,
                InventoryAreaCount,
                InventoryAreaItemCount,
            ]),
            InventoryItemsModule,
            InventoryAreasModule,
        ],
        controllers: [
            InventoryAreaController,
            InventoryAreaCountController,
            InventoryAreaItemCountController,
        ],
        providers: [],
    }).compile()};
