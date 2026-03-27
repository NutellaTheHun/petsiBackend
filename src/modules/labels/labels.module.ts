import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { MenuItem } from '../menu-items/entities/menu-item.entity';
import { MenuItemsModule } from '../menu-items/menu-items.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { LabelTypeBuilder } from './builders/label-type.builder';
import { LabelBuilder } from './builders/label.builder';
import { LabelTypeController } from './controllers/label-type.controller';
import { LabelController } from './controllers/label.controller';
import { LabelType } from './entities/label-type.entity';
import { Label } from './entities/label.entity';
import { LabelTypeService } from './services/label-type.service';
import { LabelService } from './services/label.service';
import { LabelTypeChangeDetector } from './utils/change-detectors/label-type.change-detector';
import { LabelChangeDetector } from './utils/change-detectors/label.change-detector';
import { LabelTestingUtil } from './utils/label-testing.util';
import { LabelTypeValidator } from './validators/label-type.validator';
import { LabelValidator } from './validators/label.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([Label, LabelType, MenuItem]),
    MenuItemsModule,
    CacheModule.register(),
    AppLoggingModule,
    RequestContextModule,
  ],

  controllers: [LabelController, LabelTypeController],

  providers: [
    LabelService,
    LabelTypeService,

    LabelBuilder,
    LabelTypeBuilder,

    LabelValidator,
    LabelTypeValidator,
    LabelChangeDetector,
    LabelTypeChangeDetector,

    LabelTestingUtil,
  ],

  exports: [LabelService, LabelTypeService, LabelTestingUtil],
})
export class LabelsModule {}
