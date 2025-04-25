import { PartialType } from '@nestjs/mapped-types';
import { CreateLabelTypeDto } from './create-label-type.dto';

export class UpdateLabelTypeDto extends PartialType(CreateLabelTypeDto) {}