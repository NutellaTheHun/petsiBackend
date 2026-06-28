import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TypeORMPostgresTestingModule } from '../../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { AppLoggingModule } from '../../app-logging/app-logging.module';
import { MenuItemCategory } from '../../menu-items/entities/menu-item-category.entity';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';
import { MenuItemsModule } from '../../menu-items/menu-items.module';
import { RequestContextModule } from '../../request-context/request-context.module';
import { RequestContextService } from '../../request-context/RequestContextService';
import { RevisionHistoryService } from '../../revision-history/revision-history.service';
import { DynamicPropertyConfigController } from '../controllers/dynamic-property-config.controller';
import { DynamicPropertiesModule } from '../dynamic-properties.module';
import { DynamicPropertyConfig } from '../entities/dynamic-property-config.entity';
import { DynamicPropertyConfigService } from '../services/dynamic-property-config.service';

export async function getDynamicPropertiesTestingModule(opts?: {
    dynamicPropertyConfigServiceClass?: new (...args: any[]) => DynamicPropertyConfigService;
}): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),

            TypeORMPostgresTestingModule([DynamicPropertyConfig, MenuItemCategory, MenuItem]),
            TypeOrmModule.forFeature([DynamicPropertyConfig, MenuItemCategory, MenuItem]),

            DynamicPropertiesModule,
            MenuItemsModule,

            CacheModule.register(),
            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } },
            }),
            AppLoggingModule,
            RequestContextModule,
        ],

        controllers: [DynamicPropertyConfigController],

        providers: [],
    })
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .overrideProvider(DynamicPropertyConfigService)
        .useClass(opts?.dynamicPropertyConfigServiceClass || DynamicPropertyConfigService)
        .overrideProvider(RevisionHistoryService)
        .useValue({
            appendRevision: jest.fn().mockResolvedValue({ id: 1 }),
            listRevisions: jest.fn().mockResolvedValue([]),
            getRevisionOrThrow: jest.fn(),
            getRevisionRow: jest.fn().mockResolvedValue(null),
            removeRevisionById: jest.fn(),
        })
        .compile();
}
