import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestContextModule } from '../request-context/request-context.module';
import { SettingsController } from './controllers/settings.controller';
import { Setting } from './entities/setting.entity';
import { SettingsService } from './services/settings.service';
import { SettingChangeDetector } from './utils/change-detectors/setting.change-detector';
import { SettingTestUtil } from './utils/setting-test.util';
import { SettingValidator } from './validators/setting.validator';

@Module({
    imports: [
        TypeOrmModule.forFeature([Setting]),
        CacheModule.register(),
        RequestContextModule,
    ],
    controllers: [SettingsController],
    providers: [
        SettingsService,
        SettingValidator,
        SettingChangeDetector,
        SettingTestUtil,
    ],
    exports: [SettingsService, SettingTestUtil, TypeOrmModule],
})
export class SettingsModule {}
