import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { TypeORMPostgresTestingModule } from '../../../infrastructure/database/typeorm/configs/TypeORMPostgresTesting';
import { TestRequestContextService } from '../../../test/mocks/test-request-context.service';
import { AppLoggingModule } from '../../app-logging/app-logging.module';
import { Location } from '../../locations/entities/location.entity';
import { UserLocation } from '../../locations/entities/user-location.entity';
import { LocationsModule } from '../../locations/locations.module';
import { RequestContextModule } from '../../request-context/request-context.module';
import { RequestContextService } from '../../request-context/RequestContextService';
import { Role } from '../../roles/entities/role.entity';
import { RoleModule } from '../../roles/role.module';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantsModule } from '../../tenants/tenants.module';
import { User } from '../../users/entities/user.entities';
import { UserModule } from '../../users/user.module';
import { RoleFeatureController } from '../controllers/role-feature.controller';
import { TenantFeatureController } from '../controllers/tenant-feature.controller';
import { RoleFeature } from '../entities/role-feature.entity';
import { TenantFeature } from '../entities/tenant-feature.entity';
import { FeatureFlagsModule } from '../feature-flags.module';
import { RoleFeatureService } from '../services/role-feature.service';
import { TenantFeatureService } from '../services/tenant-feature.service';

export async function getFeatureFlagsTestingModule(opts?: {
    roleFeatureServiceClass?: new (...args: any[]) => RoleFeatureService;
}): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([
                TenantFeature,
                RoleFeature,
                Role,
                Tenant,
                User,
                UserLocation,
                Location,
            ]),
            TypeOrmModule.forFeature([
                TenantFeature,
                RoleFeature,
                Role,
                Tenant,
                User,
                UserLocation,
                Location,
            ]),
            FeatureFlagsModule,
            RoleModule,
            TenantsModule,
            UserModule,
            LocationsModule,
            AppLoggingModule,
            RequestContextModule,
            CacheModule.register(),
            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } },
            }),
        ],
        controllers: [RoleFeatureController, TenantFeatureController],
        providers: [],
    })
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .overrideProvider(RoleFeatureService)
        .useClass(opts?.roleFeatureServiceClass || RoleFeatureService)
        .compile();
}
