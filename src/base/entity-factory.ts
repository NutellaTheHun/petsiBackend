import { plainToInstance } from "class-transformer";
import { ObjectLiteral } from "typeorm";

export class EntityFactory<T extends ObjectLiteral, CDto extends ObjectLiteral, UDto extends ObjectLiteral> {
    constructor(
            private entityClass: new () => T,
            private createDto: new () => CDto,
            private updateDto: new () => UDto,
        ){}

        createDtoToEntity(createDto: CDto) : T {
            return plainToInstance(this.entityClass , { ...createDto });
        }

        updateDtoToEntity(updateDto: UDto) : T {
            return plainToInstance(this.entityClass, { ...updateDto });
        }

        createEntityInstance(createDto: any) : T {
            return this.createDtoToEntity(createDto as CDto);
        }
}