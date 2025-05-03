import { Controller, Inject } from '@nestjs/common';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { ControllerBase } from '../../../base/controller-base';
import { UnitOfMeasureService } from '../services/unit-of-measure.service';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from "nestjs-pino";

@Controller('unit-of-measure')
export class UnitOfMeasureController extends ControllerBase<UnitOfMeasure> {
  constructor(
      unitService: UnitOfMeasureService,
      @Inject(CACHE_MANAGER) cacheManager: Cache,
      @Inject(Logger)logger: Logger,
  ) { super(unitService, cacheManager, logger); }
}