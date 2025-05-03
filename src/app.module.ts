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
import { UserModule } from './modules/users/user.module';
import { RoleModule } from './modules/roles/role.module';
import { APP_GUARD } from '@nestjs/core';
import { RoleGuard } from './modules/roles/guards/role.guard';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { ThrottlerGuard, ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [ 
    ConfigModule.forRoot({ isGlobal: true }),

    TypeORMPostgresModule([]),

    CacheModule.register(),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL') || 60000,
            limit: config.get('THROTTLE_LIMIT') || 10,
          }
        ]
      }),
      inject: [ConfigService],
    }),

    OrdersModule, MenuItemsModule, TemplatesModule, 
    LabelsModule, AuthModule, InventoryAreasModule, 
    InventoryItemsModule, RecipesModule, UnitOfMeasureModule,
    UserModule, RoleModule,
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
      useClass: RoleGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule {
  constructor(private dataSource: DataSource){}
}
