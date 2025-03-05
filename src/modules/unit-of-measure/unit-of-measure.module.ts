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

@Module({
  imports: [
    TypeOrmModule.forFeature([UnitOfMeasure, UnitCategory]),
  ],

  providers: [
    UnitOfMeasureService,
    UnitCategoryService, 
    UnitOfMeasureFactory, 
    UnitCategoryFactory,
  ],

  controllers: [
    UnitOfMeasureController, 
    UnitCategoryController,
  ],

  exports: [
    UnitOfMeasureService, 
    UnitCategoryService,
  ]
})
export class UnitOfMeasureModule {}
