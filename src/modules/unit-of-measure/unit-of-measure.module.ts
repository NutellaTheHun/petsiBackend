import { Module } from '@nestjs/common';
import { UnitOfMeasureService } from './unit-of-measure.service';
import { UnitOfMeasureController } from './unit-of-measure.controller';
import { UnitCategoryService } from './unit-category.service';
import { UnitCategoryController } from './unit-category.controller';
import { UnitOfMeasureFactory } from './factories/unit-of-measure.factory';
import { UnitCategoryFactory } from './factories/unit-category.factory';

@Module({
  providers: [
    UnitOfMeasureService, 
    UnitCategoryService, 
    UnitOfMeasureFactory, 
    UnitCategoryFactory,
  ],

  controllers: [
    UnitOfMeasureController, 
    UnitCategoryController,
  ]
})
export class UnitOfMeasureModule {}
