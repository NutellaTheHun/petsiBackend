import { Module } from '@nestjs/common';
import { LabelService } from './services/label.service';
import { LabelController } from './controllers/label.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Label } from './entities/label.entity';
import { MenuItemsModule } from '../menu-items/menu-items.module';
import { LabelBuilder } from './builders/label.builder';
import { LabelTestingUtil } from './utils/label-testing.util';
import { LabelType } from './entities/label-type.entity';
import { LabelTypeController } from './controllers/label-type.controller';
import { LabelTypeService } from './services/label-type.service';
import { LabelTypeBuilder } from './builders/label-type.builder';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggerModule } from 'nestjs-pino';
import { LabelValidator } from './validators/label.validator';
import { LabelTypeValidator } from './validators/label-type.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Label,
      LabelType,
    ]),
    MenuItemsModule,
    CacheModule.register(),
    LoggerModule,
  ],

  controllers: [
    LabelController,
    LabelTypeController,
  ],

  providers: [
    LabelService,
    LabelTypeService,

    LabelBuilder,
    LabelTypeBuilder,

    LabelValidator,
    LabelTypeValidator,

    LabelTestingUtil,
  ],
  
  exports: [
    LabelService,
    LabelTypeService,
    
    LabelTestingUtil,
  ]
})
export class LabelsModule {}
