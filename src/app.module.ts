import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './modules/orders/orders.module';
import { MenuItemsModule } from './modules/menu-items/menu-items.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { LabelsModule } from './modules/labels/labels.module';
import { DataSource } from 'typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { InventoryAreasModule } from './modules/inventory-areas/inventory-areas.module';
import { InventoryItemsModule } from './modules/inventory-items/inventory-items.module';
import { TypeORMPostgresModule } from './typeorm/configs/TypeORMPostgresProd';
import { RecipesModule } from './modules/recipes/recipes.module';
import { UnitOfMeasureModule } from './modules/unit-of-measure/unit-of-measure.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './modules/auth/auth.guard';
import { RolesGuard } from './modules/roles/roles.guard';

@Module({
  imports: [ 
    ConfigModule.forRoot({ isGlobal: true }),
    TypeORMPostgresModule([]),
    OrdersModule, MenuItemsModule, TemplatesModule, 
    LabelsModule, AuthModule, InventoryAreasModule, 
    InventoryItemsModule, RecipesModule, UnitOfMeasureModule,
    UsersModule, RolesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },],
})
export class AppModule {
  constructor(private dataSource: DataSource){}
}
