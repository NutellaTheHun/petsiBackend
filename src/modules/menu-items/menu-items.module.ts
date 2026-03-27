import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { OrderCategory } from '../orders/entities/order-category.entity';
import { OrderContainerItem } from '../orders/entities/order-container-item.entity';
import { OrderMenuItem } from '../orders/entities/order-menu-item.entity';
import { Order } from '../orders/entities/order.entity';
import { RequestContextModule } from '../request-context/request-context.module';
import { MenuItemCategoryBuilder } from './builders/menu-item-category.builder';
import { MenuItemContainerItemBuilder } from './builders/menu-item-container-item.builder';
import { MenuItemSizeBuilder } from './builders/menu-item-size.builder';
import { MenuItemBuilder } from './builders/menu-item.builder';
import { MenuItemCategoryController } from './controllers/menu-item-category.controller';
import { MenuItemContainerItemController } from './controllers/menu-item-container-item.controller';
import { MenuItemSizeController } from './controllers/menu-item-size.controller';
import { MenuItemController } from './controllers/menu-item.controller';
import { MenuItemCategory } from './entities/menu-item-category.entity';
import { MenuItemContainerItem } from './entities/menu-item-container-item.entity';
import { MenuItemSize } from './entities/menu-item-size.entity';
import { MenuItem } from './entities/menu-item.entity';
import { MenuItemCategoryService } from './services/menu-item-category.service';
import { MenuItemContainerItemService } from './services/menu-item-container-item.service';
import { MenuItemSizeService } from './services/menu-item-size.service';
import { MenuItemService } from './services/menu-item.service';
import { MenuItemCategoryChangeDetector } from './utils/change-detectors/menu-item-category.change-detector';
import { MenuItemContainerItemChangeDetector } from './utils/change-detectors/menu-item-container-item.change-detector';
import { MenuItemSizeChangeDetector } from './utils/change-detectors/menu-item-size.change-detector';
import { MenuItemChangeDetector } from './utils/change-detectors/menu-item.change-detector';
import { MenuItemContainerItemComposer } from './utils/composers/menu-item-container-item.composer';
import { MenuItemTestingUtil } from './utils/menu-item-testing.util';
import { MenuItemCategoryValidator } from './validators/menu-item-category.validator';
import { MenuItemContainerItemValidator } from './validators/menu-item-container-item.validator';
import { MenuItemSizeValidator } from './validators/menu-item-size.validator';
import { MenuItemValidator } from './validators/menu-item.validator';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            MenuItemCategory,
            MenuItemSize,
            MenuItem,
            MenuItemContainerItem,
            Order,
            OrderCategory,
            OrderMenuItem,
            OrderContainerItem,
        ]),
        CacheModule.register(),
        AppLoggingModule,
        RequestContextModule,
    ],

    controllers: [
        MenuItemCategoryController,
        MenuItemSizeController,
        MenuItemController,
        MenuItemContainerItemController,
    ],

    providers: [
        MenuItemCategoryService,
        MenuItemSizeService,
        MenuItemService,
        MenuItemContainerItemService,

        MenuItemCategoryBuilder,
        MenuItemSizeBuilder,
        MenuItemBuilder,
        MenuItemContainerItemBuilder,

        MenuItemCategoryValidator,
        MenuItemContainerItemValidator,
        MenuItemSizeValidator,
        MenuItemValidator,

        MenuItemContainerItemComposer,
        MenuItemCategoryChangeDetector,
        MenuItemSizeChangeDetector,
        MenuItemContainerItemChangeDetector,
        MenuItemChangeDetector,

        MenuItemTestingUtil,
    ],

    exports: [
        MenuItemCategoryService,
        MenuItemSizeService,
        MenuItemService,
        MenuItemContainerItemService,

        MenuItemTestingUtil,
    ],
})
export class MenuItemsModule { }