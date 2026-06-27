import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
import { HolderEntityType, ValueType } from '../../entities/dynamic-property-config.entity';

export class CreateDynamicPropertyConfigDto {
    @ApiProperty({ enum: HolderEntityType })
    @IsEnum(HolderEntityType)
    @IsNotEmpty()
    readonly holderEntityType: HolderEntityType;

    @ApiPropertyOptional({ nullable: true, type: Number })
    @IsNumber()
    @IsOptional()
    readonly holderCategoryId: number | null;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    readonly propertyName: string;

    @ApiProperty({ enum: ValueType })
    @IsEnum(ValueType)
    @IsNotEmpty()
    readonly valueType: ValueType;

    @ApiPropertyOptional({ nullable: true })
    @IsString()
    @ValidateIf((o) => o.valueType === ValueType.EntityReference)
    @IsNotEmpty()
    readonly valueEntityType: string | null;

    @ApiPropertyOptional({ nullable: true, type: Number })
    @IsNumber()
    @IsOptional()
    readonly valueEntityCategoryId: number | null;
}
