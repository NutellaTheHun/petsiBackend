import { plainToInstance } from "class-transformer";
import { ObjectLiteral } from "typeorm";

export class EntityFactory<T extends ObjectLiteral, CDto extends ObjectLiteral, UDto extends ObjectLiteral> {
    constructor(
            private entityClass: new () => T,
            private createDto: new () => CDto,
            private updateDto: new () => UDto,
            private defaultVals
        ){}

        createDtoToEntity(createDto: CDto) : T {
            return plainToInstance(this.entityClass, createDto);
        }

        updateDtoToEntity(updateDto: UDto) : T {
            return plainToInstance(this.entityClass , updateDto);
        }
        
        createEntityInstance(vals: any, propertyOverrides: Record<string, any> = {}) : T {
            const dtoWithExtras = { ...this.defaultVals, ...vals, ...propertyOverrides };
            return this.createDtoToEntity(
                this.createDtoInstance(dtoWithExtras)
            );
        }

        updateEntityInstance(vals: any, propertyOverrides: Record<string, any> = {}) : T {
            const dtoWithExtras = { ...this.defaultVals, ...vals, ...propertyOverrides };
            return this.updateDtoToEntity(
                this.updateDtoInstance(dtoWithExtras)
            );
        }

        createDtoInstance(vals: any) : CDto{
            return plainToInstance(this.createDto, {...this.defaultVals, ...vals }) as CDto;
        }

        updateDtoInstance(vals: any) : UDto{
            return plainToInstance(this.updateDto, {...this.defaultVals, ...vals }) as UDto;
        }
}