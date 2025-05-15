import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateRoleDto {
    @ApiProperty({ description: 'Name of the Role entity.' })
    @IsString()
    @IsOptional()
    readonly name?: string;

    @ApiProperty({ description: 'Ids of User entities referencing the role.' })
    @IsArray()
    @IsNumber({}, { each: true})
    @IsPositive({ each: true})
    @IsOptional()
    readonly userIds?: number[];
}