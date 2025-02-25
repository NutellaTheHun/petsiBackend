import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export class CreateRoleDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsArray()
    @IsNumber({}, { each: true})
    @IsPositive({ each: true})
    readonly userIds: number[] = [];
}

export function CreateDefaultDtoValues(): Partial<CreateRoleDto> {
    return {
        userIds: []
    };
}