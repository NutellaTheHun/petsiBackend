import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateRoleDto {
    @ApiProperty({ description: 'Name of the Role entity.' })
    @IsString()
    @IsOptional()
    readonly roleName?: string;
}