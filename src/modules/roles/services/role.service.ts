import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { RequestContextService } from '../../request-context/RequestContextService';
import { AppLogger } from '../../app-logging/app-logger';
import { RoleBuilder } from '../builders/role.builder';
import { Role } from '../entities/role.entity';
import { RoleValidator } from '../validators/role.validator';

@Injectable()
export class RoleService extends ServiceBase<Role> {
  
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @Inject(forwardRef(() => RoleBuilder))
    roleBuilder: RoleBuilder,

    validator: RoleValidator,

    requestContextService: RequestContextService,

    logger: AppLogger,
  ){ super(roleRepo, roleBuilder, validator, 'RoleService', requestContextService, logger); }

  async findOneByName(roleName: string, relations?: Array<keyof Role>): Promise<Role | null> {
    return await this.roleRepo.findOne({ where: { roleName: roleName }, relations: relations  });
  }
}
