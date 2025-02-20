import { plainToInstance } from "class-transformer";
import { ObjectLiteral } from "typeorm";

export class EntityFactory<T extends ObjectLiteral, CDto extends ObjectLiteral, UDto extends ObjectLiteral> {
    constructor(
            private entityClass: new () => T,
            private createDto: new () => CDto,
            private updateDto: new () => UDto,
        ){}

        createDtoToEntity(createDto: CDto, propertyOverrides: Record<string, any> = {}) : T {
            if(propertyOverrides){
                const dtoWithExtras = { ...createDto, ...propertyOverrides }
                return plainToInstance(this.entityClass , dtoWithExtras);
            }
            return plainToInstance(this.entityClass, { ...createDto });
        }

        updateDtoToEntity(updateDto: UDto, propertyOverrides: Record<string, any> = {}) : T {
            if(propertyOverrides){
                const dtoWithExtras = { ...updateDto, ...propertyOverrides }
                return plainToInstance(this.entityClass , dtoWithExtras);
            }
            return plainToInstance(this.entityClass, { ...updateDto });
        }

        createEntityInstance(createDto: any, propertyOverrides: Record<string, any> = {}) : T {
            return this.createDtoToEntity(createDto as CDto, propertyOverrides);
        }
}