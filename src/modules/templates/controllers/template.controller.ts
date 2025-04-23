import { Controller } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { Template } from '../entities/template.entity';
import { TemplateService } from '../services/template.service';

@Controller('templates')
export class TemplateController extends ControllerBase<Template>{
  constructor(private readonly templateService: TemplateService) { super(templateService); }
}
