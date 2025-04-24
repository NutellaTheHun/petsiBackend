import { Controller } from '@nestjs/common';
import { ControllerBase } from '../../../base/controller-base';
import { TemplateMenuItem } from '../entities/template-menu-item.entity';
import { TemplateMenuItemService } from '../services/template-menu-item.service';

@Controller('template-menu-items')
export class TemplateMenuItemController extends ControllerBase<TemplateMenuItem>{
  constructor(private readonly templateService: TemplateMenuItemService) { super(templateService); }
}
