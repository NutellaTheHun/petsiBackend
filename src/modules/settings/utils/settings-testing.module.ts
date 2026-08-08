import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TypeORMPostgresTestingModule } from '../../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { AppLoggingModule } from '../../app-logging/app-logging.module';
import { Location } from '../../locations/entities/location.entity';
import { LocationsModule } from '../../locations/locations.module';
import { RequestContextModule } from '../../request-context/request-context.module';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantsModule } from '../../tenants/tenants.module';
import { SettingsController } from '../controllers/settings.controller';
import { Setting } from '../entities/setting.entity';
import { SettingsModule } from '../settings.module';
import { SettingsService } from '../services/settings.service';
import { SettingChangeDetector } from './change-detectors/setting.change-detector';

export async function getSettingsTestingModule(opts?: {
    settingsServiceClass?: new (...args: any[]) => SettingsService;
    settingChangeDetectorClass?: new (...args: any[]) => SettingChangeDetector;
}): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([Setting, Tenant, Location]),
            TypeOrmModule.forFeature([Setting, Tenant, Location]),
            SettingsModule,
            TenantsModule,
            LocationsModule,
            AppLoggingModule,
            RequestContextModule,
            CacheModule.register(),
            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } },
            }),
        ],
        controllers: [SettingsController],
        providers: [],
    })
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .overrideProvider(SettingsService)
        .useClass(opts?.settingsServiceClass || SettingsService)
        .overrideProvider(SettingChangeDetector)
        .useClass(opts?.settingChangeDetectorClass || SettingChangeDetector)
        .compile();
}
