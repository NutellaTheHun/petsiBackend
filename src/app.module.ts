import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { globalGuardProviders, throttlerOptions } from './app.setup';
import { ExceptionsModule } from './common/exceptions/exceptions.module';
import { pinoHttpRequestIdOptions } from './common/middleware/request-id';
import { RequestIdMiddleware } from './common/middleware/RequestIdMiddleware';
import { TenantResolutionMiddleware } from './common/middleware/TenantResolutionMiddleware';
import { selectTypeOrmModule } from './infrastructure/database/typeorm/typeorm.module';
import { AuthModule } from './modules/auth/auth.module';
import { DynamicPropertiesModule } from './modules/dynamic-properties/dynamic-properties.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { InventoryAreasModule } from './modules/inventory-areas/inventory-areas.module';
import { InventoryItemsModule } from './modules/inventory-items/inventory-items.module';
import { LabelsModule } from './modules/labels/labels.module';
import { LocationsModule } from './modules/locations/locations.module';
import { MenuItemsModule } from './modules/menu-items/menu-items.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RequestContextModule } from './modules/request-context/request-context.module';
import { RoleModule } from './modules/roles/role.module';
import { SeedModule } from './modules/seed/seed.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { TenantProvisioningModule } from './modules/tenant-provisioning/tenant-provisioning.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UserModule } from './modules/users/user.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),

        ScheduleModule.forRoot(),

        selectTypeOrmModule([]),

        // Lives inside container, wiped on container restart, each container has its own cache
        CacheModule.register(),

        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) =>
                throttlerOptions((key) => config.get<string>(key)),
            inject: [ConfigService],
        }),

        LoggerModule.forRoot({
            pinoHttp: {
                ...pinoHttpRequestIdOptions,
                // Production writes plain JSON lines; pretty-printing is dev-only.
                transport:
                    process.env.NODE_ENV === 'production'
                        ? undefined
                        : {
                              target: 'pino-pretty',
                              options: {
                                  colorize: true,
                                  translateTime: 'SYS:standard',
                                  ignore: 'pid,hostname',
                              },
                          },
            },
        }),

        ExceptionsModule,
        AuthModule,
        RequestContextModule,
        SeedModule,

        OrdersModule,
        MenuItemsModule,
        TemplatesModule,
        LabelsModule,
        InventoryAreasModule,
        InventoryItemsModule,
        RecipesModule,
        UserModule,
        RoleModule,
        DynamicPropertiesModule,
        ReportsModule,
        TenantsModule,
        LocationsModule,
        TenantProvisioningModule,
        SettingsModule,
        FeatureFlagsModule,
    ],

    controllers: [AppController],

    providers: [AppService, ...globalGuardProviders()],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestIdMiddleware, TenantResolutionMiddleware)
            .forRoutes('*');
    }
    constructor(private dataSource: DataSource) {}
}
