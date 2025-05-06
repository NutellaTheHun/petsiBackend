import { Module } from '@nestjs/common';
import { UnitOfMeasureController } from './controllers/unit-of-measure.controller';
import { UnitCategoryService } from './services/unit-category.service';
import { UnitCategoryController } from './controllers/unit-category.controller';
import { UnitOfMeasureService } from './services/unit-of-measure.service';
import { UnitOfMeasure } from './entities/unit-of-measure.entity';
import { UnitCategory } from './entities/unit-category.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitOfMeasureBuilder } from './builders/unit-of-measure.builder';
import { UnitCategoryBuilder } from './builders/unit-category.builder';
import { UnitOfMeasureTestingUtil } from './utils/unit-of-measure-testing.util';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggerModule } from 'nestjs-pino';
import { UnitCategoryValidator } from './validators/unit-category.validator';
import { UnitOfMeasureValidator } from './validators/unit-of-measure.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([UnitOfMeasure, UnitCategory]),
    CacheModule.register(),
    LoggerModule,
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
