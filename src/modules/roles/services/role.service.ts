import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { RoleBuilder } from '../builders/role.builder';
import { Role } from '../entities/role.entities';
import { RoleValidator } from '../validators/role.validator';


@Injectable()
export class RoleService extends ServiceBase<Role> {
  
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @Inject(forwardRef(() => RoleBuilder))
    roleBuilder: RoleBuilder,
    validator: RoleValidator,
  ){ super(roleRepo, roleBuilder, validator, 'RoleService'); }

  async findOneByName(roleName: string, relations?: Array<keyof Role>): Promise<Role | null> {
    return await this.roleRepo.findOne({ where: { name: roleName }, relations: relations  });
  }
}
