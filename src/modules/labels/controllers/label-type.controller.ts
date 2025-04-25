import { Controller } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { LabelType } from '../entities/label-type.entity';
import { LabelTypeService } from '../services/label-type.service';

@Controller('label-types')
export class LabelTypeController extends ControllerBase<LabelType>{
  constructor(private readonly labelTypeService: LabelTypeService) { super(labelTypeService); }
}