import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class CreateTemplateDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsBoolean()
    @IsOptional()
    readonly isPie: boolean;

    @IsArray()
    @IsNumber({}, { each: true})
    @IsPositive({ each: true})
    readonly templateItemIds: number[] = [];
}
