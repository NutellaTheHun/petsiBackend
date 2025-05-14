import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Inject } from '@nestjs/common';
import { Cache } from "cache-manager";
import { ControllerBase } from '../../../base/controller-base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { Label } from '../entities/label.entity';
import { LabelService } from '../services/label.service';

@Controller('labels')
export class LabelController extends ControllerBase<Label>{
    constructor(
      labelService: LabelService,
      @Inject(CACHE_MANAGER) cacheManager: Cache,
      logger: AppLogger,
      requestContextService: RequestContextService,
    ) { super(labelService, cacheManager, 'LabelController', requestContextService, logger); }
}