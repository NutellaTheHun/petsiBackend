import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateLabelDto {
    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly menuItemId?: number;

    @IsString()
    @IsOptional()
    readonly imageUrl?: string;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    readonly typeId?: number;
}
