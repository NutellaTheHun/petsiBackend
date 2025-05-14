import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateOrderTypeDto {
    @IsString()
    @IsOptional()
    readonly name?: string;

    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true})
    @IsOptional()
    readonly orderIds?: number[];
}