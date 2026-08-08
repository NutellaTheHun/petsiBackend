import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryAreasModule } from '../inventory-areas/inventory-areas.module';
import { InventoryItemsModule } from '../inventory-items/inventory-items.module';
import { LabelsModule } from '../labels/labels.module';
import { Location } from '../locations/entities/location.entity';
import { UserLocation } from '../locations/entities/user-location.entity';
import { LocationsModule } from '../locations/locations.module';
import { MenuItemsModule } from '../menu-items/menu-items.module';
import { OrdersModule } from '../orders/orders.module';
import { RecipesModule } from '../recipes/recipes.module';
import { Role } from '../roles/entities/role.entity';
import { RoleModule } from '../roles/role.module';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantsModule } from '../tenants/tenants.module';
import { TemplatesModule } from '../templates/templates.module';
import { User } from '../users/entities/user.entities';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Tenant, Location, UserLocation]),
    RoleModule,
    TenantsModule,
    LocationsModule,
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
