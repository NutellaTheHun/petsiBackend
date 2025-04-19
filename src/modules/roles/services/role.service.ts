import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../../base/service-base';
import { RoleBuilder } from '../builders/role.builder';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Role } from '../entities/role.entities';


@Injectable()
export class RoleService extends ServiceBase<Role> {
  
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    private readonly roleBuilder: RoleBuilder,
  ){ super(roleRepo)}

  async create(dto: CreateRoleDto): Promise<Role | null> {
    const alreadyExists = await this.findOneByName(dto.name);
    if(alreadyExists){ return null; }

    const role = await this.roleBuilder.buildCreateDto(dto);
    return await this.roleRepo.save(role);
  }

  async findOneByName(roleName: string, relations?: Array<keyof Role>): Promise<Role | null> {
    return await this.roleRepo.findOne({ where: { name: roleName }, relations: relations  });
  }

  /**
   * Id currently not used, using Repository.save for lifecycle hooks
   * @param id currently not used, using Repository.save for lifecycle hooks
   * @param roleDto 
   * @returns 
   */
  async update(id: number, dto: UpdateRoleDto): Promise<Role | null> {
    const toUpdate = await this.findOne(id);
    if(!toUpdate){ return null; }

    const role = await this.roleBuilder.buildUpdateDto(toUpdate, dto);
    return this.roleRepo.save(role);
  }
}
