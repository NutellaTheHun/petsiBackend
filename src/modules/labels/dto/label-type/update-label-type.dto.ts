import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateLabelTypeDto {
    @ApiProperty({
        description: 'Name of the LabelType entity.',
        example: '2x1',
    })
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @ApiProperty({
        description: 'The length of the label type in hundreths of an inch',
        example: 200,
    })
    @IsNumber()
    @IsNotEmpty()
    readonly length: number;

    @ApiProperty({
        description: 'The length of the label type in hundreths of an inch',
        example: 100,
    })
    @IsNumber()
    @IsNotEmpty()
    readonly width: number;
}
