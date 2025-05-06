import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { MenuItem } from "../entities/menu-item.entity";

@Injectable()
export class MenuItemValidator extends ValidatorBase<MenuItem> {
    constructor(
        @InjectRepository(MenuItem)
        private readonly repo: Repository<MenuItem>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}