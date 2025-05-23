import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { UserBuilder } from '../builders/user.builder';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entities';

@Injectable()
export class UserService extends ServiceBase<User> {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @Inject(forwardRef(() => UserBuilder))
        userBuilder: UserBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(userRepo, userBuilder, 'UserService', requestContextService, logger); }

    async create(createUserDto: CreateUserDto) {
        const user = await super.create(createUserDto) as User;
        user.password = "";
        return user;
    }

    async findOneByName(username: string, relations?: Array<keyof User>): Promise<User | null> {
        return await this.userRepo.findOne({ where: { username: username }, relations: relations });
    }
}