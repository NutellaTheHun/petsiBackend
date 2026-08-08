import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantsModule } from '../tenants/tenants.module';
import { RoleBuilder } from './builders/role.builder';
import { RoleController } from './controllers/role.controller';
import { Role } from './entities/role.entity';
import { RoleService } from './services/role.service';
import { RoleChangeDetector } from './utils/change-detectors/role.change-detector';
import { RoleTestUtil } from './utils/role-test.util';
import { RoleValidator } from './validators/role.validator';

@Module({
    imports: [
        TypeOrmModule.forFeature([Role, Tenant]),
        TenantsModule,
        CacheModule.register(),
        AppLoggingModule,
        RequestContextModule,
    ],
    controllers: [RoleController,],
    providers: [RoleService, RoleBuilder, RoleValidator, RoleTestUtil, RoleChangeDetector],
    exports: [RoleService, RoleTestUtil, TypeOrmModule],
})
export class RoleModule { }
