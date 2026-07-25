import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantsModule } from '../tenants/tenants.module';
import { LocationBuilder } from './builders/location.builder';
import { LocationController } from './controllers/location.controller';
import { Location } from './entities/location.entity';
import { LocationService } from './services/location.service';
import { LocationChangeDetector } from './utils/change-detectors/location.change-detector';
import { LocationTestUtil } from './utils/location-test.util';
import { LocationValidator } from './validators/location.validator';

@Module({
    imports: [
        TypeOrmModule.forFeature([Location, Tenant]),
        TenantsModule,
        CacheModule.register(),
        AppLoggingModule,
        RequestContextModule,
    ],
    controllers: [LocationController],
    providers: [LocationService, LocationBuilder, LocationValidator, LocationTestUtil, LocationChangeDetector],
    exports: [LocationService, LocationTestUtil, TypeOrmModule],
})
export class LocationsModule { }
