import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleFactory } from './entities/role.factory';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entities';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { ServiceBase } from '../../base/service-base';

@Injectable()
export class RolesService extends ServiceBase<Role> {
  
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    private readonly roleFactory: RoleFactory,

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ){ super(roleRepo)}

  async create(createRoleDto: CreateRoleDto): Promise<Role | null> {
    const alreadyExists = await this.roleRepo.findOne({ where: { name: createRoleDto.name }});
    if(alreadyExists){ return null; }

    const userIds = createRoleDto.userIds || [];
    const role = await this.roleFactory.createEntityInstance(createRoleDto, { users: await this.usersService.findEntitiesById(userIds)});

    return await this.roleRepo.save(role);
  }

  async findOneByName(roleName: string, relations?: string[]): Promise<Role | null> {
    return await this.roleRepo.findOne({ where: { name: roleName }, relations: relations  });
  }

  /**
   * Id currently not used, using Repository.save for lifecycle hooks
   * @param id currently not used, using Repository.save for lifecycle hooks
   * @param roleDto 
   * @returns 
   */
  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role | null> {
    const alreadyExists = await this.roleRepo.findOne({ where: { id }});
    if(!alreadyExists){ return null; } //more detailed error

    const userIds = updateRoleDto.userIds || []
    const role = await this.roleFactory.updateEntityInstance(updateRoleDto, { users: this.usersService.findEntitiesById(userIds)});
    
    return this.roleRepo.save(role);
  }
}
