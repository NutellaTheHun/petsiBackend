import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";

@ValidatorConstraint({ name: 'InventoryItemOrSubRecipe', async: false })
export class InventoryItemOrSubRecipe implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const object = args.object as any;
    
    const hasInventoryItem = !!object.inventoryItemId;
    const hasSubRecipe = !!object.subRecipeIngredientId;

    return (hasInventoryItem || hasSubRecipe) && !(hasInventoryItem && hasSubRecipe);
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Either inventoryItemId or subRecipeIngredientId should be provided, but not both';
  }
}