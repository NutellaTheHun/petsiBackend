import { Controller, Inject } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { Label } from '../entities/label.entity';
import { LabelService } from '../services/label.service';
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Controller('labels')
export class LabelController extends ControllerBase<Label>{
    constructor(
      private readonly labelService: LabelService,
      @Inject(CACHE_MANAGER) cacheManager: Cache
    ) { super(labelService, cacheManager); }
}