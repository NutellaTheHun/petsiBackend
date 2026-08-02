import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { Role } from '../roles/entities/role.entity';
import { RoleModule } from '../roles/role.module';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantsModule } from '../tenants/tenants.module';
import { User } from '../users/entities/user.entities';
import { UserModule } from '../users/user.module';
import { LocationBuilder } from './builders/location.builder';
import { LocationController } from './controllers/location.controller';
import { UserLocationController } from './controllers/user-location.controller';
import { Location } from './entities/location.entity';
import { UserLocation } from './entities/user-location.entity';
import { LocationService } from './services/location.service';
import { UserLocationService } from './services/user-location.service';
import { LocationChangeDetector } from './utils/change-detectors/location.change-detector';
import { UserLocationChangeDetector } from './utils/change-detectors/user-location.change-detector';
import { LocationTestUtil } from './utils/location-test.util';
import { UserLocationTestUtil } from './utils/user-location-test.util';
import { LocationValidator } from './validators/location.validator';
import { UserLocationValidator } from './validators/user-location.validator';

@Module({
    imports: [
        TypeOrmModule.forFeature([Location, Tenant, UserLocation, User, Role]),
        TenantsModule,
        UserModule,
        RoleModule,
        CacheModule.register(),
        AppLoggingModule,
        RequestContextModule,
    ],
    controllers: [LocationController, UserLocationController],
    providers: [
        LocationService,
        LocationBuilder,
        LocationValidator,
        LocationTestUtil,
        LocationChangeDetector,
        UserLocationService,
        UserLocationValidator,
        UserLocationTestUtil,
        UserLocationChangeDetector,
    ],
    exports: [LocationService, LocationTestUtil, UserLocationService, UserLocationTestUtil, TypeOrmModule],
})
export class LocationsModule { }
