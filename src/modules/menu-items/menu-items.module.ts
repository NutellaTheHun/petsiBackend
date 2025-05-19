import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { MenuItemCategoryBuilder } from './builders/menu-item-category.builder';
import { MenuItemComponentBuilder } from './builders/menu-item-component.builder';
import { MenuItemSizeBuilder } from './builders/menu-item-size.builder';
import { MenuItemBuilder } from './builders/menu-item.builder';
import { MenuItemCategoryController } from './controllers/menu-item-category.controller';
import { MenuItemComponentController } from './controllers/menu-item-component.controller';
import { MenuItemSizeController } from './controllers/menu-item-size.controller';
import { MenuItemController } from './controllers/menu-item.controller';
import { MenuItemCategory } from './entities/menu-item-category.entity';
import { MenuItemComponent } from './entities/menu-item-component.entity';
import { MenuItemSize } from './entities/menu-item-size.entity';
import { MenuItem } from './entities/menu-item.entity';
import { MenuItemCategoryService } from './services/menu-item-category.service';
import { MenuItemComponentService } from './services/menu-item-component.service';
import { MenuItemSizeService } from './services/menu-item-size.service';
import { MenuItemService } from './services/menu-item.service';
import { MenuItemTestingUtil } from './utils/menu-item-testing.util';
import { MenuItemCategoryValidator } from './validators/menu-item-category.validator';
import { MenuItemComponentValidator } from './validators/menu-item-component.validator';
import { MenuItemSizeValidator } from './validators/menu-item-size.validator';
import { MenuItemValidator } from './validators/menu-item.validator';
import { ComponentOption } from './entities/component-option.entity';
import { MenuItemComponentOptions } from './entities/menu-item-component-options.entity';
import { MenuItemComponentOptionsController } from './controllers/menu-item-component-options.controller';
import { ComponentOptionController } from './controllers/component-option.controller';
import { MenuItemComponentOptionsService } from './services/menu-item-component-options.service';
import { ComponentOptionService } from './services/component-option.service';
import { MenuItemComponentOptionsBuilder } from './builders/menu-item-component-options.builder';
import { ComponentOptionBuilder } from './builders/component-option.builder';
import { ComponentOptionValidator } from './validators/component-option.validator';
import { MenuItemComponentOptionsValidator } from './validators/menu-item-component-options.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MenuItemCategory,
      MenuItemSize,
      MenuItem,
      MenuItemComponent,
      ComponentOption,
      MenuItemComponentOptions,
    ]),
    CacheModule.register(),
    AppLoggingModule,
    RequestContextModule,
  ],

  controllers: [
    MenuItemCategoryController,
    MenuItemSizeController,
    MenuItemController,
    MenuItemComponentController,
    MenuItemComponentOptionsController,
    ComponentOptionController,
  ],

  providers: [
    MenuItemCategoryService,
    MenuItemSizeService,
    MenuItemService,
    MenuItemComponentService,
    MenuItemComponentOptionsService,
    ComponentOptionService,

    MenuItemCategoryBuilder,
    MenuItemSizeBuilder,
    MenuItemBuilder,
    MenuItemComponentBuilder,
    MenuItemComponentOptionsBuilder,
    ComponentOptionBuilder,

    MenuItemCategoryValidator,
    MenuItemComponentValidator,
    MenuItemSizeValidator,
    MenuItemValidator,
    MenuItemComponentOptionsValidator,
    ComponentOptionValidator,

    MenuItemTestingUtil,
  ],

  exports: [
    MenuItemCategoryService,
    MenuItemSizeService,
    MenuItemService,
    MenuItemComponentService,
    MenuItemComponentOptionsService,
    ComponentOptionService,

    MenuItemTestingUtil,
  ]
})
export class MenuItemsModule {}
