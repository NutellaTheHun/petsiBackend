import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { TenantBuilder } from './builders/tenant.builder';
import { TenantController } from './controllers/tenant.controller';
import { Tenant } from './entities/tenant.entity';
import { TenantService } from './services/tenant.service';
import { TenantChangeDetector } from './utils/change-detectors/tenant.change-detector';
import { TenantTestUtil } from './utils/tenant-test.util';
import { TenantValidator } from './validators/tenant.validator';

@Module({
    imports: [
        TypeOrmModule.forFeature([Tenant]),
        CacheModule.register(),
        AppLoggingModule,
        RequestContextModule,
    ],
    controllers: [TenantController],
    providers: [TenantService, TenantBuilder, TenantValidator, TenantTestUtil, TenantChangeDetector],
    exports: [TenantService, TenantTestUtil],
})
export class TenantsModule { }
