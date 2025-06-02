import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppLoggingModule } from './modules/app-logging/app-logging.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './modules/auth/guards/auth.guard';
import { InventoryAreasModule } from './modules/inventory-areas/inventory-areas.module';
import { InventoryItemsModule } from './modules/inventory-items/inventory-items.module';
import { LabelsModule } from './modules/labels/labels.module';
import { MenuItemsModule } from './modules/menu-items/menu-items.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { RequestContextModule } from './modules/request-context/request-context.module';
import { RoleGuard } from './modules/roles/guards/role.guard';
import { RoleModule } from './modules/roles/role.module';
import { SeedModule } from './modules/seed/seed.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { UnitOfMeasureModule } from './modules/unit-of-measure/unit-of-measure.module';
import { UserModule } from './modules/users/user.module';
import { TypeORMPostgresModule } from './typeorm/configs/TypeORMPostgresProd';
import { RequestIdMiddleware } from './util/RequestIdMiddleware';

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

        LoggerModule.forRoot({
            pinoHttp: {
                genReqId: (req) => req['requestId'],
                customProps: (req) => ({
                    requestId: req['requestId'],
                }),
                transport: {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'SYS:standard',
                        ignore: 'pid,hostname',
                    },
                },
            },
        }),

        AuthModule, AppLoggingModule, RequestContextModule, SeedModule,

        OrdersModule, MenuItemsModule, TemplatesModule,
        LabelsModule, InventoryAreasModule, InventoryItemsModule,
        RecipesModule, UnitOfMeasureModule, UserModule, RoleModule,
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
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestIdMiddleware)
            .forRoutes('*');
    }
    constructor(private dataSource: DataSource) { }
}
