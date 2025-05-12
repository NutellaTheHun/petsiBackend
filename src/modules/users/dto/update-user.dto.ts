import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    readonly username?: string;

    @IsString()
    @IsOptional()
    readonly email?: string | null;

    @IsString()
    @IsOptional()
    readonly password?: string;
    
    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true })
    @IsOptional()
    readonly roleIds?: number[];
}