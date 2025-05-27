import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggingModule } from '../app-logging/app-logging.module';
import { RequestContextModule } from '../request-context/request-context.module';
import { UnitOfMeasureCategoryBuilder } from './builders/unit-of-measure-category.builder';
import { UnitOfMeasureBuilder } from './builders/unit-of-measure.builder';
import { UnitOfMeasureCategoryController } from './controllers/unit-of-measure-category.controller';
import { UnitOfMeasureController } from './controllers/unit-of-measure.controller';
import { UnitOfMeasureCategory } from './entities/unit-of-measure-category.entity';
import { UnitOfMeasure } from './entities/unit-of-measure.entity';
import { UnitOfMeasureCategoryService } from './services/unit-of-measure-category.service';
import { UnitOfMeasureService } from './services/unit-of-measure.service';
import { UnitOfMeasureTestingUtil } from './utils/unit-of-measure-testing.util';
import { UnitOfMeasureCategoryValidator } from './validators/unit-of-measure-category.validator';
import { UnitOfMeasureValidator } from './validators/unit-of-measure.validator';

@Module({
    imports: [
        TypeOrmModule.forFeature([UnitOfMeasure, UnitOfMeasureCategory]),
        CacheModule.register(),
        AppLoggingModule,
        RequestContextModule,
    ],

    providers: [
        UnitOfMeasureService,
        UnitOfMeasureCategoryService,

        UnitOfMeasureBuilder,
        UnitOfMeasureCategoryBuilder,

        UnitOfMeasureCategoryValidator,
        UnitOfMeasureValidator,

        UnitOfMeasureTestingUtil,
    ],

    controllers: [
        UnitOfMeasureController,
        UnitOfMeasureCategoryController,
    ],

    exports: [
        UnitOfMeasureService,
        UnitOfMeasureCategoryService,

        UnitOfMeasureTestingUtil,
    ]
})
export class UnitOfMeasureModule { }
