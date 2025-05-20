import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateUserDto {
    @ApiProperty({ description: '' })
    @IsString()
    @IsNotEmpty()
    readonly username: string;

    @ApiProperty({ description: '' })
    @IsString()
    @IsOptional()
    readonly email?: string;

    @ApiProperty({ description: '' })
    @IsString()
    @IsNotEmpty()
    readonly password: string;
    
    @ApiProperty({ description: 'Id of roles the user has.' })
    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true })
    @IsOptional()
    readonly roleIds?: number[];
}