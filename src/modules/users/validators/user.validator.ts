import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ValidatorBase } from "../../../base/validator-base";
import { ValidationError } from "../../../util/exceptions/validation-error";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { User } from "../entities/user.entities";
import { AppLogger } from "../../app-logging/app-logger";
import { RequestContextService } from "../../request-context/RequestContextService";

@Injectable()
export class UserValidator extends ValidatorBase<User> {
    constructor(
        @InjectRepository(User)
        private readonly repo: Repository<User>,
        logger: AppLogger,
        requestContextService: RequestContextService,
    ) { super(repo, 'User', requestContextService, logger); }

    public async validateCreate(dto: CreateUserDto): Promise<void> {

        // username exists
        if (await this.helper.exists(this.repo, 'username', dto.username)) {
            this.addError({
                errorMessage: 'username name already exists.',
                errorType: 'EXIST',
                contextEntity: 'CreateUserDto',
                sourceEntity: 'User',
                value: dto.username,
            } as ValidationError);
        }

        this.throwIfErrors()
    }

    public async validateUpdate(id: number, dto: UpdateUserDto): Promise<void> {

        // username exists
        if (dto.username) {
            if (await this.helper.exists(this.repo, 'username', dto.username)) {
                this.addError({
                    errorMessage: 'username name already exists.',
                    errorType: 'EXIST',
                    contextEntity: 'UpdateUserDto',
                    contextId: id,
                    sourceEntity: 'User',
                    value: dto.username,
                } as ValidationError);
            }
        }

        this.throwIfErrors()
    }
}