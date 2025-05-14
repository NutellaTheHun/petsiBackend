import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { UnitCategoryBuilder } from './builders/unit-category.builder';
import { UnitOfMeasureBuilder } from './builders/unit-of-measure.builder';
import { UnitCategoryController } from './controllers/unit-category.controller';
import { UnitOfMeasureController } from './controllers/unit-of-measure.controller';
import { UnitCategory } from './entities/unit-category.entity';
import { UnitOfMeasure } from './entities/unit-of-measure.entity';
import { UnitCategoryService } from './services/unit-category.service';
import { UnitOfMeasureService } from './services/unit-of-measure.service';
import { UnitOfMeasureTestingUtil } from './utils/unit-of-measure-testing.util';
import { UnitCategoryValidator } from './validators/unit-category.validator';
import { UnitOfMeasureValidator } from './validators/unit-of-measure.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([UnitOfMeasure, UnitCategory]),
    CacheModule.register(),
    AppLoggingModule,
    RequestContextModule,
  ],

  providers: [
    UnitOfMeasureService,
    UnitCategoryService,

    UnitOfMeasureBuilder,
    UnitCategoryBuilder,

    UnitCategoryValidator,
    UnitOfMeasureValidator,

    UnitOfMeasureTestingUtil,
  ],

  controllers: [
    UnitOfMeasureController, 
    UnitCategoryController,
  ],

  exports: [
    UnitOfMeasureService, 
    UnitCategoryService,
    
    UnitOfMeasureTestingUtil,
  ]
})
export class UnitOfMeasureModule {}
