import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TypeORMPostgresTestingModule } from '../../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { AppLoggingModule } from '../../app-logging/app-logging.module';
import { RequestContextModule } from '../../request-context/request-context.module';
import { RequestContextService } from '../../request-context/RequestContextService';
import { TenantController } from '../controllers/tenant.controller';
import { Tenant } from '../entities/tenant.entity';
import { TenantService } from '../services/tenant.service';
import { TenantsModule } from '../tenants.module';
import { TenantChangeDetector } from './change-detectors/tenant.change-detector';

export async function getTenantsTestingModule(opts?: {
    tenantServiceClass?: new (...args: any[]) => TenantService;
    tenantChangeDetectorClass?: new (...args: any[]) => TenantChangeDetector;
}): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([Tenant]),
            TypeOrmModule.forFeature([Tenant]),
            TenantsModule,
            AppLoggingModule,
            RequestContextModule,
            CacheModule.register(),
            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } },
            }),
        ],
        controllers: [TenantController],
        providers: [],
    })
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .overrideProvider(TenantService)
        .useClass(opts?.tenantServiceClass || TenantService)
        .overrideProvider(TenantChangeDetector)
        .useClass(opts?.tenantChangeDetectorClass || TenantChangeDetector)
        .compile();
}
