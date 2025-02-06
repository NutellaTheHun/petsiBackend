import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './modules/orders/orders.module';
import { MenuItemsModule } from './modules/menu-items/menu-items.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { LabelsModule } from './modules/labels/labels.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { InventoryAreasModule } from './modules/inventory-areas/inventory-areas.module';
import { InventoryItemsModule } from './modules/inventory-items/inventory-items.module';

@Module({
  imports: [ 
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localHost',
      port: 306,
      username: 'root',
      password: 'root',
      database: 'test',
      autoLoadEntities: true,
      synchronize: false,
    }),
    OrdersModule, MenuItemsModule, TemplatesModule, LabelsModule, 
    AuthModule, InventoryAreasModule, InventoryItemsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource){}
}
