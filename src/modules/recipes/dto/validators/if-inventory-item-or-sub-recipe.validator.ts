import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";

@ValidatorConstraint({ name: 'IfInventoryItemOrSubRecipe', async: false })
export class IfInventoryItemOrSubRecipe implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;

    if(!object.inventoryItemId && !object.subRecipeIngredientId){ return true; }
    
    const hasInventoryItem = !!object.inventoryItemId;
    const hasSubRecipe = !!object.subRecipeIngredientId;

    return (hasInventoryItem || hasSubRecipe) && !(hasInventoryItem && hasSubRecipe);
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Either inventoryItemId or subRecipeIngredientId should be provided, but not both';
  }
}