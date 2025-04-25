import { Controller } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { Label } from '../entities/label.entity';
import { LabelService } from '../services/label.service';

@Controller('labels')
export class LabelController extends ControllerBase<Label>{
  constructor(private readonly labelService: LabelService) { super(labelService); }
}
