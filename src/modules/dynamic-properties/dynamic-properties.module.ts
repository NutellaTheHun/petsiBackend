import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { MenuItemDynamicPropertyValue } from '../menu-items/entities/menu-item-dynamic-property-value.entity';
import { MenuItemCategory } from '../menu-items/entities/menu-item-category.entity';
import { RequestContextModule } from '../request-context/request-context.module';
import { DynamicPropertyConfigBuilder } from './builders/dynamic-property-config.builder';
import { DynamicPropertyConfigController } from './controllers/dynamic-property-config.controller';
import { DynamicPropertyConfig } from './entities/dynamic-property-config.entity';
import { DynamicPropertyConfigService } from './services/dynamic-property-config.service';
import { DynamicPropertyConfigValidator } from './validators/dynamic-property-config.validator';

@Module({
    imports: [
        TypeOrmModule.forFeature([DynamicPropertyConfig, MenuItemCategory, MenuItemDynamicPropertyValue]),
        CacheModule.register(),
        AppLoggingModule,
        RequestContextModule,
    ],

    controllers: [DynamicPropertyConfigController],

    providers: [
        DynamicPropertyConfigService,
        DynamicPropertyConfigBuilder,
        DynamicPropertyConfigValidator,
    ],

    exports: [DynamicPropertyConfigService],
})
export class DynamicPropertiesModule {}
