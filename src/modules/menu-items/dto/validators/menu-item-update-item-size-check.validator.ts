import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ name: 'MenuItemMenuItemSizeCheck', async: false })
export class MenuItemUpdateItemSizeCheck implements ValidatorConstraintInterface {
    validate(_: any, args: ValidationArguments){
        const object = args.object as any;

        const menuItemUpdate = !!object.menuItemId;
        const itemSizeUpdate = !!object.menuItemSizeId;

        return( (menuItemUpdate && itemSizeUpdate) || !menuItemUpdate);
    }

    defaultMessage(args: ValidationArguments): string {
        return 'If menuItem is being reassigned, itemSize update must be included';
    }
}