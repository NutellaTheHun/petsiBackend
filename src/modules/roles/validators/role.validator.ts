import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { Role } from "../entities/role.entity";
import { CreateRoleDto } from "../dto/create-role.dto";
import { UpdateRoleDto } from "../dto/update-role.dto";

@Injectable()
export class RoleValidator extends ValidatorBase<Role> {
    constructor(
        @InjectRepository(Role)
        private readonly repo: Repository<Role>,
    ){ super(repo); }

    public async validateCreate(dto: CreateRoleDto): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { name: dto.name }});
        if(exists) { 
            return `Role with name ${dto.name} already exists`; 
        }
        return null;
    }
    public async validateUpdate(dto: UpdateRoleDto): Promise<string | null> {
        return null;
    }
}