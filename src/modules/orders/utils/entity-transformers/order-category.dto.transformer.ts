import { UpdateOrderCategoryDto } from "../../dto/order-category/update-order-category.dto";
import { OrderCategory } from "../../entities/order-category.entity";

export function orderCategoryToUpdateDto(orderCategory: OrderCategory): UpdateOrderCategoryDto {
    return {
        name: orderCategory.name,
    };
}