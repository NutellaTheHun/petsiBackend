import { plainToInstance } from "class-transformer";
import { UpdateOrderCategoryDto } from "../../dto/order-category/update-order-category.dto";
import { OrderCategory } from "../../entities/order-category.entity";

export function orderCategoryToUpdateDto(orderCategory: OrderCategory, merge: Partial<UpdateOrderCategoryDto> = {}): UpdateOrderCategoryDto {
    return plainToInstance(UpdateOrderCategoryDto, {
        name: orderCategory.name,
        ...merge,
    });
}