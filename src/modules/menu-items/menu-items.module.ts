import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
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
import { MenuItemTestingUtil } from './utils/menu-item-testing.util';
import { MenuItemCategoryValidator } from './validators/menu-item-category.validator';
import { MenuItemContainerItemValidator } from './validators/menu-item-container-item.validator';
import { MenuItemSizeValidator } from './validators/menu-item-size.validator';
import { MenuItemValidator } from './validators/menu-item.validator';
import { MenuItemContainerRule } from './entities/menu-item-container-rule.entity';
import { MenuItemContainerOptions } from './entities/menu-item-container-options.entity';
import { MenuItemContainerOptionsController } from './controllers/menu-item-container-options.controller';
import { MenuItemContainerRuleController } from './controllers/menu-item-container-rule.controller';
import { MenuItemContainerOptionsService } from './services/menu-item-container-options.service';
import { MenuItemContainerRuleService } from './services/menu-item-container-rule.service';
import { MenuItemContainerOptionsBuilder } from './builders/menu-item-container-options.builder';
import { MenuItemContainerRuleBuilder } from './builders/menu-item-container-rule.builder';
import { MenuItemContainerRuleValidator } from './validators/menu-item-container-rule.validator';
import { MenuItemContainerOptionsValidator } from './validators/menu-item-container-options.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MenuItemCategory,
      MenuItemSize,
      MenuItem,
      MenuItemContainerItem,
      MenuItemContainerRule,
      MenuItemContainerOptions,
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
    MenuItemContainerOptionsController,
    MenuItemContainerRuleController,
  ],

  providers: [
    MenuItemCategoryService,
    MenuItemSizeService,
    MenuItemService,
    MenuItemContainerItemService,
    MenuItemContainerOptionsService,
    MenuItemContainerRuleService,

    MenuItemCategoryBuilder,
    MenuItemSizeBuilder,
    MenuItemBuilder,
    MenuItemContainerItemBuilder,
    MenuItemContainerOptionsBuilder,
    MenuItemContainerRuleBuilder,

    MenuItemCategoryValidator,
    MenuItemContainerItemValidator,
    MenuItemSizeValidator,
    MenuItemValidator,
    MenuItemContainerOptionsValidator,
    MenuItemContainerRuleValidator,

    MenuItemTestingUtil,
  ],

  exports: [
    MenuItemCategoryService,
    MenuItemSizeService,
    MenuItemService,
    MenuItemContainerItemService,
    MenuItemContainerOptionsService,
    MenuItemContainerRuleService,

    MenuItemTestingUtil,
  ]
})
export class MenuItemsModule {}
