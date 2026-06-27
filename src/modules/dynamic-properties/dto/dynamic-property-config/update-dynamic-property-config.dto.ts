import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
import { HolderEntityType, ValueType } from '../../entities/dynamic-property-config.entity';

export class UpdateDynamicPropertyConfigDto {
    @ApiPropertyOptional({ enum: HolderEntityType })
    @IsEnum(HolderEntityType)
    @IsOptional()
    readonly holderEntityType?: HolderEntityType;

    @ApiPropertyOptional({ nullable: true, type: Number })
    @IsNumber()
    @IsOptional()
    readonly holderCategoryId?: number | null;

    @ApiPropertyOptional()
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    readonly propertyName?: string;

    @ApiPropertyOptional({ enum: ValueType })
    @IsEnum(ValueType)
    @IsOptional()
    readonly valueType?: ValueType;

    @ApiPropertyOptional({ nullable: true })
    @IsString()
    @IsNotEmpty()
    @ValidateIf((o) => o.valueType === ValueType.EntityReference)
    @IsOptional()
    readonly valueEntityType?: string | null;

    @ApiPropertyOptional({ nullable: true, type: Number })
    @IsNumber()
    @IsOptional()
    readonly valueEntityCategoryId?: number | null;
}
