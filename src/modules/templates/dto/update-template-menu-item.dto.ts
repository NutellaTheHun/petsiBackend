import { IsNumber, IsPositive } from 'class-validator';
import { BaseTemplateMenuItemDto } from './base-template-menu-item.dto';

export class UpdateTemplateMenuItemDto extends BaseTemplateMenuItemDto {
    readonly mode: 'update' = 'update';

    @IsPositive()
    @IsNumber()
    readonly id: number;
}
