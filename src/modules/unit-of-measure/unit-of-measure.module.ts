import { Module } from '@nestjs/common';
import { UnitOfMeasureController } from './controllers/unit-of-measure.controller';
import { UnitCategoryService } from './services/unit-category.service';
import { UnitCategoryController } from './controllers/unit-category.controller';
import { UnitOfMeasureFactory } from './factories/unit-of-measure.factory';
import { UnitCategoryFactory } from './factories/unit-category.factory';
import { UnitOfMeasureService } from './services/unit-of-measure.service';
import { UnitOfMeasure } from './entities/unit-of-measure.entity';
import { UnitCategory } from './entities/unit-category.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitOfMeasureBuilder } from './builders/unit-of-measure.builder';
import { UnitCategoryBuilder } from './builders/unit-category.builder';
import { UnitOfMeasureTestingUtil } from './utils/unit-of-measure-testing.util';

@Module({
  imports: [
    TypeOrmModule.forFeature([UnitOfMeasure, UnitCategory]),
  ],

  providers: [
    UnitOfMeasureService,
    UnitCategoryService, 

    UnitOfMeasureFactory, 
    UnitCategoryFactory,

    UnitOfMeasureBuilder,
    UnitCategoryBuilder,

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
