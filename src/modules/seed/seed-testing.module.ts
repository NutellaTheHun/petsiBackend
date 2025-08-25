import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TypeORMPostgresTestingModule } from '../../typeorm/configs/TypeORMPostgresTesting';
import { TestRequestContextService } from '../../util/mocks/test-request-context.service';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { InventoryAreaCount } from '../inventory-areas/entities/inventory-area-count.entity';
import { InventoryAreaItem } from '../inventory-areas/entities/inventory-area-item.entity';
import { InventoryArea } from '../inventory-areas/entities/inventory-area.entity';
import { InventoryAreasModule } from '../inventory-areas/inventory-areas.module';
import { InventoryItemCategory } from '../inventory-items/entities/inventory-item-category.entity';
import { InventoryItemPackage } from '../inventory-items/entities/inventory-item-package.entity';
import { InventoryItemSize } from '../inventory-items/entities/inventory-item-size.entity';
import { InventoryItemVendor } from '../inventory-items/entities/inventory-item-vendor.entity';
import { InventoryItem } from '../inventory-items/entities/inventory-item.entity';
import { InventoryItemsModule } from '../inventory-items/inventory-items.module';
import { LabelType } from '../labels/entities/label-type.entity';
import { Label } from '../labels/entities/label.entity';
import { LabelsModule } from '../labels/labels.module';
import { MenuItemCategory } from '../menu-items/entities/menu-item-category.entity';
import { MenuItemContainerItem } from '../menu-items/entities/menu-item-container-item.entity';
import { MenuItemContainerOptions } from '../menu-items/entities/menu-item-container-options.entity';
import { MenuItemContainerRule } from '../menu-items/entities/menu-item-container-rule.entity';
import { MenuItemSize } from '../menu-items/entities/menu-item-size.entity';
import { MenuItem, MenuItemsModule } from '../menu-items/menu-items.module';
import { OrderCategory } from '../orders/entities/order-category.entity';
import { OrderContainerItem } from '../orders/entities/order-container-item.entity';
import { OrderMenuItem } from '../orders/entities/order-menu-item.entity';
import { Order } from '../orders/entities/order.entity';
import { OrdersModule } from '../orders/orders.module';
import { RecipeCategory } from '../recipes/entities/recipe-category.entity';
import { RecipeIngredient } from '../recipes/entities/recipe-ingredient.entity';
import { RecipeSubCategory } from '../recipes/entities/recipe-sub-category.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { RecipesModule } from '../recipes/recipes.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { RequestContextService } from '../request-context/RequestContextService';
import { Role } from '../roles/entities/role.entity';
import { RoleModule } from '../roles/role.module';
import { TemplateMenuItem } from '../templates/entities/template-menu-item.entity';
import { Template } from '../templates/entities/template.entity';
import { TemplatesModule } from '../templates/templates.module';
import { UnitOfMeasureCategory } from '../unit-of-measure/entities/unit-of-measure-category.entity';
import { UnitOfMeasure } from '../unit-of-measure/entities/unit-of-measure.entity';
import { UnitOfMeasureModule } from '../unit-of-measure/unit-of-measure.module';
import { User } from '../users/entities/user.entities';
import { UserModule } from '../users/user.module';
import { SeedModule } from './seed.module';

export async function getSeedTestingModule(): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      TypeORMPostgresTestingModule([
        InventoryArea,
        InventoryAreaCount,
        InventoryAreaItem,

        InventoryItem,
        InventoryItemCategory,
        InventoryItemPackage,
        InventoryItemSize,
        InventoryItemVendor,

        Label,
        LabelType,

        MenuItem,
        MenuItemCategory,
        MenuItemContainerItem,
        MenuItemContainerOptions,
        MenuItemContainerRule,
        MenuItemSize,

        Order,
        OrderCategory,
        OrderContainerItem,
        OrderMenuItem,

        Recipe,
        RecipeCategory,
        RecipeIngredient,
        RecipeSubCategory,

        Template,
        TemplateMenuItem,

        UnitOfMeasure,
        UnitOfMeasureCategory,

        User,
        Role,
      ]),
      TypeOrmModule.forFeature([
        InventoryArea,
        InventoryAreaCount,
        InventoryAreaItem,

        InventoryItem,
        InventoryItemCategory,
        InventoryItemPackage,
        InventoryItemSize,
        InventoryItemVendor,

        Label,
        LabelType,

        MenuItem,
        MenuItemCategory,
        MenuItemContainerItem,
        MenuItemContainerOptions,
        MenuItemContainerRule,
        MenuItemSize,

        Order,
        OrderCategory,
        OrderContainerItem,
        OrderMenuItem,

        Recipe,
        RecipeCategory,
        RecipeIngredient,
        RecipeSubCategory,

        Template,
        TemplateMenuItem,

        UnitOfMeasure,
        UnitOfMeasureCategory,

        User,
        Role,
      ]),
      SeedModule,
      UserModule,
      RoleModule,
      InventoryAreasModule,
      InventoryItemsModule,
      LabelsModule,
      MenuItemsModule,
      OrdersModule,
      RecipesModule,
      TemplatesModule,
      UnitOfMeasureModule,
      CacheModule.register(),
      LoggerModule.forRoot({
        pinoHttp: { transport: { target: 'pino-pretty' } },
      }),
      AppLoggingModule,
      RequestContextModule,
    ],

    providers: [],
  })
    .overrideProvider(RequestContextService)
    .useClass(TestRequestContextService)
    .compile();
}
