import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeORMPostgresTestingModule } from "../../../typeorm/configs/TypeORMPostgresTesting";
import { MenuItemCategory } from "../entities/menu-item-category.entity";
import { MenuItemSize } from "../entities/menu-item-size.entity";
import { MenuItem } from "../entities/menu-item.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MenuItemCategoryController } from "../controllers/menu-item-category.controller";
import { MenuItemSizeController } from "../controllers/menu-item-size.controller";
import { MenuItemController } from "../controllers/menu-item.controller";

export async function getMenuItemTestingModule(): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([
                MenuItemCategory,
                MenuItemSize,
                MenuItem,
            ]),
            TypeOrmModule.forFeature([
                MenuItemCategory,
                MenuItemSize,
                MenuItem,
            ]),
        ],

        controllers: [
            MenuItemCategoryController,
            MenuItemSizeController,
            MenuItemController,
        ],

        providers: [],
    }).compile();}