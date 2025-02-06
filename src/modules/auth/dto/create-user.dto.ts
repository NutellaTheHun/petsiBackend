import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsString()
    @IsNotEmpty()
    readonly email: string;

    @IsString()
    @IsNotEmpty()
    readonly passwordHash: string;

    
    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true })
    readonly roleIds: number[] = [];
}