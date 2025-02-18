import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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

@Module({
  imports: [ 
    ConfigModule.forRoot({ isGlobal: true }),
    TypeORMPostgresModule([]),
    OrdersModule, MenuItemsModule, TemplatesModule, 
    LabelsModule, AuthModule, InventoryAreasModule, 
    InventoryItemsModule, RecipesModule, UnitOfMeasureModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource){}
}
