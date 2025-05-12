/**
     * Use to create child entities when the parent entity is also being created.
     * - Example creating a Recipe:
     * - Recipe dto also contains nested create RecipeIngredientDTOs
     * - RecipeService.create() is executed
     * - While building Recipe, RecipeIngredientBuilder is called to build ingredients
     * - Recipe Entity (not in db yet so no id) is passed to builder through buildChildCreateDTO
     * 
     * Not all classes need this function.
     * 
     * If RecipeIngredientService.create is executed, this method wouldn't be used. (buildCreateDto() would)
     */
export interface IBuildChildDto<Parent = any, Child = any> {
    buildChildCreateDto(parentItem: Parent, dto: any): Promise<Child>;
    buildChildEntity(dto: any): void;
}