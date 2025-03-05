import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { InventoryItem } from "../entities/inventory-item.entity";
import { InventoryItemCategory } from "../entities/inventory-item-category.entity";
import { InventoryItemPackage } from "../entities/inventory-item-package.entity";
import { InventoryItemSize } from "../entities/inventory-item-size.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InventoryItemsController } from "../controllers/inventory-items.controller";
import { InventoryItemCategoriesController } from "../controllers/inventory-item-categories.contoller";
import { InventoryItemSizesController } from "../controllers/inventory-item-sizes.contoller";
import { InventoryItemPackagesController } from "../controllers/inventory-item-packages.contoller";
import { InventoryItemVendor } from "../entities/inventory-item-vendor.entity";
import { UnitOfMeasure } from "../../unit-of-measure/entities/unit-of-measure.entity";
import { UnitOfMeasureModule } from "../../unit-of-measure/unit-of-measure.module";

export async function getInventoryItemsTestingModule(): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([
                InventoryItem, 
                InventoryItemCategory, 
                InventoryItemPackage, 
                InventoryItemSize,
                InventoryItemVendor,]
            ),
            TypeOrmModule.forFeature([
                InventoryItem, 
                InventoryItemCategory, 
                InventoryItemPackage, 
                InventoryItemSize,
                InventoryItemVendor,]
            ),
            UnitOfMeasureModule,
    ],

    controllers: [
        InventoryItemsController, 
        InventoryItemCategoriesController, 
        InventoryItemSizesController, 
        InventoryItemPackagesController,
        InventoryItemsController,
    ],

    providers: [],

}).compile()};