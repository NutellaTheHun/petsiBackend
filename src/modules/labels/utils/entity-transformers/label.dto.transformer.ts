import { UpdateLabelDto } from "../../dto/label/update-label.dto";
import { Label } from "../../entities/label.entity";

export function labelToUpdateDto(label: Label): UpdateLabelDto {
    return {
        imageUrl: label.imageUrl,
        menuItemId: label.menuItem.id,
        labelTypeId: label.labelType.id,
    };
}