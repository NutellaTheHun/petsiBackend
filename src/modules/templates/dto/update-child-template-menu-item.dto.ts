import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateChildTemplateMenuItemDto {
    readonly mode: 'update' = 'update';

    @IsPositive()
    @IsNumber()
    @IsNotEmpty()
    readonly id: number;

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
