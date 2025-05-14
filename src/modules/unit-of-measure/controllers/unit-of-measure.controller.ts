import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Inject } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { UnitOfMeasureService } from '../services/unit-of-measure.service';

@Controller('unit-of-measure')
export class UnitOfMeasureController extends ControllerBase<UnitOfMeasure> {
  constructor(
    unitService: UnitOfMeasureService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    logger: AppLogger,
    requestContextService: RequestContextService,
  ) { super(unitService, cacheManager, 'UnitOfMeasureController', requestContextService, logger); }
}