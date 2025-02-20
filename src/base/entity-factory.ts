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

        createEntityInstance(createDto: any, propertyOverrides: Record<string, any> = {}): T {
            const dtoWithExtras = { ...this.defaultVals, ...createDto, ...propertyOverrides } as CDto;
            return this.createDtoToEntity(dtoWithExtras);
        }

        updateEntityInstance(updateDto: any, propertyOverrides: Record<string, any> = {}): T {
            const dtoWithExtras = { ...this.defaultVals, ...updateDto, ...propertyOverrides } as CDto;
            return this.createDtoToEntity(dtoWithExtras);
        }

        createDtoInstance(vals: any) : CDto{
            return plainToInstance(this.createDto, {...this.defaultVals, ...vals }) as CDto;
        }
}