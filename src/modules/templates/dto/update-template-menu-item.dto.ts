import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateTemplateMenuItemDto {
    @IsString()
    @IsOptional()
    readonly displayName?: string;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly menuItemId?: number;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly tablePosIndex?: number;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    readonly templateId?: number;
}
