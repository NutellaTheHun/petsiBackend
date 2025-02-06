import { PartialType } from '@nestjs/mapped-types';
import { CreateTemplateMenuItemDto } from './create-template-menu-item.dto';

export class UpdateTemplateMenuItemDto extends PartialType(CreateTemplateMenuItemDto) {}
