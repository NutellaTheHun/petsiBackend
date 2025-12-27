import { Module } from '@nestjs/common';
import { InventoryAreasModule } from '../inventory-areas/inventory-areas.module';
import { InventoryItemsModule } from '../inventory-items/inventory-items.module';
import { LabelsModule } from '../labels/labels.module';
import { MenuItemsModule } from '../menu-items/menu-items.module';
import { OrdersModule } from '../orders/orders.module';
import { RecipesModule } from '../recipes/recipes.module';
import { RoleModule } from '../roles/role.module';
import { TemplatesModule } from '../templates/templates.module';
import { UnitOfMeasureModule } from '../unit-of-measure/unit-of-measure.module';
import { UserModule } from '../users/user.module';
import { SeedService } from './seed.service';

@Module({
  imports: [
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
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
