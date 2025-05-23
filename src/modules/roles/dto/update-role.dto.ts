import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateRoleDto {
    @ApiProperty({ description: 'Name of the Role entity.' })
    @IsString()
    @IsOptional()
    readonly roleName?: string;
}