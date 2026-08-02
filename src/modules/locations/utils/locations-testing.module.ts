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
import { Role } from '../../roles/entities/role.entity';
import { RoleModule } from '../../roles/role.module';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantsModule } from '../../tenants/tenants.module';
import { User } from '../../users/entities/user.entities';
import { UserModule } from '../../users/user.module';
import { LocationController } from '../controllers/location.controller';
import { UserLocationController } from '../controllers/user-location.controller';
import { Location } from '../entities/location.entity';
import { UserLocation } from '../entities/user-location.entity';
import { LocationsModule } from '../locations.module';
import { LocationService } from '../services/location.service';
import { UserLocationService } from '../services/user-location.service';
import { LocationChangeDetector } from './change-detectors/location.change-detector';
import { UserLocationChangeDetector } from './change-detectors/user-location.change-detector';

export async function getLocationsTestingModule(opts?: {
    locationServiceClass?: new (...args: any[]) => LocationService;
    locationChangeDetectorClass?: new (...args: any[]) => LocationChangeDetector;
    userLocationServiceClass?: new (...args: any[]) => UserLocationService;
    userLocationChangeDetectorClass?: new (...args: any[]) => UserLocationChangeDetector;
}): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            TypeORMPostgresTestingModule([Location, Tenant, UserLocation, User, Role]),
            TypeOrmModule.forFeature([Location, Tenant, UserLocation, User, Role]),
            LocationsModule,
            TenantsModule,
            UserModule,
            RoleModule,
            AppLoggingModule,
            RequestContextModule,
            CacheModule.register(),
            LoggerModule.forRoot({
                pinoHttp: { transport: { target: 'pino-pretty' } },
            }),
        ],
        controllers: [LocationController, UserLocationController],
        providers: [],
    })
        .overrideProvider(RequestContextService)
        .useClass(TestRequestContextService)
        .overrideProvider(LocationService)
        .useClass(opts?.locationServiceClass || LocationService)
        .overrideProvider(LocationChangeDetector)
        .useClass(opts?.locationChangeDetectorClass || LocationChangeDetector)
        .overrideProvider(UserLocationService)
        .useClass(opts?.userLocationServiceClass || UserLocationService)
        .overrideProvider(UserLocationChangeDetector)
        .useClass(opts?.userLocationChangeDetectorClass || UserLocationChangeDetector)
        .compile();
}
