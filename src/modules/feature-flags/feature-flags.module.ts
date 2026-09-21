import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { RoleFeatureController } from './controllers/role-feature.controller';
import { TenantFeatureController } from './controllers/tenant-feature.controller';
import { RoleFeature } from './entities/role-feature.entity';
import { TenantFeature } from './entities/tenant-feature.entity';
import { RoleFeatureService } from './services/role-feature.service';
import { TenantFeatureService } from './services/tenant-feature.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([TenantFeature, RoleFeature]),
        CacheModule.register(),
        AppLoggingModule,
        RequestContextModule,
    ],
    controllers: [RoleFeatureController, TenantFeatureController],
    providers: [RoleFeatureService, TenantFeatureService],
    exports: [RoleFeatureService, TenantFeatureService, TypeOrmModule],
})
export class FeatureFlagsModule {}
