import { UpdateLabelTypeDto } from "../../dto/label-type/update-label-type.dto";
import { LabelType } from "../../entities/label-type.entity";

export function labelTypeToUpdateDto(labelType: LabelType): UpdateLabelTypeDto {
    return {
        name: labelType.name,
        length: labelType.length,
        width: labelType.width,
    };
}