import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { Role } from "../entities/role.entities";

@Injectable()
export class RoleValidator extends ValidatorBase<Role> {
    constructor(
        @InjectRepository(Role)
        private readonly repo: Repository<Role>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.name }});
        if(exists) { 
            return 'Role already exists'; 
        }
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}