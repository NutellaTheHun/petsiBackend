import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateUserDto {
    @ApiProperty({ description: '' })
    @IsString()
    @IsOptional()
    readonly username?: string;

    @ApiProperty({ description: '' })
    @IsString()
    @IsOptional()
    readonly email?: string | null;

    @ApiProperty({ description: '' })
    @IsString()
    @IsOptional()
    readonly password?: string;

    @ApiProperty({
        description: 'Id of roles the user has.',
    })
    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true })
    @IsOptional()
    readonly roleIds?: number[];
}