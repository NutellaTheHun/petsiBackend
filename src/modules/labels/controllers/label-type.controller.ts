import { Controller, Inject } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { LabelType } from '../entities/label-type.entity';
import { LabelTypeService } from '../services/label-type.service';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from "nestjs-pino";

@Controller('label-types')
export class LabelTypeController extends ControllerBase<LabelType>{
    constructor(
      labelTypeService: LabelTypeService,
      @Inject(CACHE_MANAGER) cacheManager: Cache,
      @Inject(Logger)logger: Logger,
    ) { super(labelTypeService, cacheManager, logger); }
}