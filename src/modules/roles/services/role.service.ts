import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { AppLogger } from '../../app-logging/app-logger';
import { RequestContextService } from '../../request-context/RequestContextService';
import { RoleBuilder } from '../builders/role.builder';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleService extends ServiceBase<Role> {

    constructor(
        @InjectRepository(Role)
        private readonly repo: Repository<Role>,

        @Inject(forwardRef(() => RoleBuilder))
        builder: RoleBuilder,

        requestContextService: RequestContextService,
        logger: AppLogger,
    ) { super(repo, builder, 'RoleService', requestContextService, logger); }

    async findOneByName(roleName: string, relations?: Array<keyof Role>): Promise<Role | null> {
        return await this.repo.findOne({ where: { roleName: roleName }, relations: relations });
    }
}
