import { Controller } from '@nestjs/common';
import { UnitOfMeasure } from '../entities/unit-of-measure.entity';
import { ControllerBase } from '../../../base/controller-base';
import { UnitOfMeasureService } from '../services/unit-of-measure.service';

@Controller('unit-of-measure')
export class UnitOfMeasureController extends ControllerBase<UnitOfMeasure> {
  constructor(
      private readonly unitService: UnitOfMeasureService
  ) { super(unitService); }
}
