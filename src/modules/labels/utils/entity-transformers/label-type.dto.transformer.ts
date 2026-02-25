import { plainToInstance } from "class-transformer";
import { UpdateLabelTypeDto } from "../../dto/label-type/update-label-type.dto";
import { LabelType } from "../../entities/label-type.entity";

export function labelTypeToUpdateDto(labelType: LabelType, merge: Partial<UpdateLabelTypeDto> = {}): UpdateLabelTypeDto {
    return plainToInstance(UpdateLabelTypeDto, {
        name: labelType.name,
        length: labelType.length,
        width: labelType.width,
        ...merge,
    });
}