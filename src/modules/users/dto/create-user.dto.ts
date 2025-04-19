import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateUserDto {

    @IsString()
    @IsNotEmpty()
    readonly username: string;

    @IsString()
    //@IsNotEmpty()
    @IsOptional()
    readonly email?: string | null;

    @IsString()
    @IsNotEmpty()
    readonly password: string;
    
    @IsArray()
    @IsNumber({}, { each: true })
    @IsPositive({ each: true })
    readonly roleIds: number[] = [];
}

export function CreateUserDtoDefaultValues(): Partial<CreateUserDto> {
    return {
        roleIds: [],
    };
}