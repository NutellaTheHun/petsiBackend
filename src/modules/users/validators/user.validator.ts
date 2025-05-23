import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { User } from "../entities/user.entities";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { ValidationError } from "../../../util/exceptions/validationError";

@Injectable()
export class UserValidator extends ValidatorBase<User> {
    constructor(
        @InjectRepository(User)
        private readonly repo: Repository<User>,
    ){ super(repo); }

    public async validateCreate(dto: CreateUserDto): Promise<ValidationError[]> {

        // username exists
        if(await this.helper.exists(this.repo, 'username', dto.username)) { 
            this.addError({
                error: 'username name already exists.',
                status: 'EXIST',
                contextEntity: 'CreateUserDto',
                sourceEntity: 'User',
                value: dto.username,
            } as ValidationError);
        }

        return this.errors;
    }
    
    public async validateUpdate(id: number, dto: UpdateUserDto): Promise<ValidationError[]> {

        // username exists
        if(dto.username){
            if(await this.helper.exists(this.repo, 'username', dto.username)) { 
                this.addError({
                    error: 'username name already exists.',
                    status: 'EXIST',
                    contextEntity: 'UpdateUserDto',
                    contextId: id,
                    sourceEntity: 'User',
                    value: dto.username,
                } as ValidationError);
            }
        }
        
        return this.errors;
    }
}