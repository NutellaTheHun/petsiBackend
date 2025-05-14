import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Inject } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { LabelType } from '../entities/label-type.entity';
import { LabelTypeService } from '../services/label-type.service';

@Controller('label-types')
export class LabelTypeController extends ControllerBase<LabelType>{
    constructor(
      labelTypeService: LabelTypeService,
      @Inject(CACHE_MANAGER) cacheManager: Cache,
      logger: AppLogger,
      requestContextService: RequestContextService,
    ) { super(labelTypeService, cacheManager,'LabelTypeController', requestContextService, logger); }
}