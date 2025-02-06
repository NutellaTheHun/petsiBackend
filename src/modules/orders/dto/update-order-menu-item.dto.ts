import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderMenuItemDto } from './create-order-menu-item.dto';

export class UpdateOrderMenuItemDto extends PartialType(CreateOrderMenuItemDto) {}
