import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { User } from "../entities/user.entities";

@Injectable()
export class UserValidator extends ValidatorBase<User> {
    constructor(
        @InjectRepository(User)
        private readonly repo: Repository<User>,
    ){ super(repo); }

    public async validateCreate(dto: any): Promise<string | null> {
        const exists = await this.repo.findOne({ where: { username: dto.username }});
        if(exists) { 
            return `User with name ${dto.username} already exists`; 
        }
        return null;
    }
    public async validateUpdate(dto: any): Promise<string | null> {
        return null;
    }
}