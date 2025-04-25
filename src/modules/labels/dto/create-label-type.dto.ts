import { IsNotEmpty, IsString } from "class-validator";

export class CreateLabelTypeDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;
}
