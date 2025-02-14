import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateUserDto {

    @IsString()
    @IsNotEmpty()
    readonly username: string;

    @IsString()
    @IsNotEmpty()
    readonly email: string;

    @IsString()
    @IsNotEmpty()
    readonly password: string;
    
    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true })
    readonly roleIds: number[] = [];
}