import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryAreasModule } from '../inventory-areas/inventory-areas.module';
import { InventoryItemsModule } from '../inventory-items/inventory-items.module';
import { LabelsModule } from '../labels/labels.module';
import { MenuItemsModule } from '../menu-items/menu-items.module';
import { OrdersModule } from '../orders/orders.module';
import { RecipesModule } from '../recipes/recipes.module';
import { Role } from '../roles/entities/role.entity';
import { RoleModule } from '../roles/role.module';
import { TemplatesModule } from '../templates/templates.module';
import { User } from '../users/entities/user.entities';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    RoleModule,
    InventoryAreasModule,
    InventoryItemsModule,
    LabelsModule,
    MenuItemsModule,
    OrdersModule,
    RecipesModule,
    TemplatesModule,
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
