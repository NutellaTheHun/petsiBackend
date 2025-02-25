import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleFactory } from './entities/role.factory';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entities';
import { In, QueryBuilder, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';

@Injectable()
export class RolesService {
  
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    private readonly roleFactory: RoleFactory,

    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ){}

  async create(createRoleDto: CreateRoleDto): Promise<Role | null> {
    const alreadyExists = await this.roleRepo.findOne({ where: { name: createRoleDto.name }});
    if(alreadyExists){ return null; }

    const userIds = createRoleDto.userIds || [];
    const role = await this.roleFactory.createEntityInstance(createRoleDto, { users: await this.usersService.findUsersById(userIds)});

    return await this.roleRepo.save(role);
  }

  async findAll(relations?: string[]): Promise<Role[]> {
    return await this.roleRepo.find({relations: relations});
  }

  async findOne(id: number, relations?: string[]): Promise<Role | null> {
    return await this.roleRepo.findOne({ where: { id }, relations: relations });
  }

  async findOneByName(roleName: string, relations?: string[]): Promise<Role | null> {
    return await this.roleRepo.findOne({ where: { name: roleName }, relations: relations  });
  }

  async findRolesById( roleIds: number[], relations?: string[]): Promise<Role[]> {
    return await this.roleRepo.find({ where: { id: In(roleIds) }, relations: relations });
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
    const role = await this.roleFactory.updateEntityInstance(updateRoleDto, { users: this.usersService.findUsersById(userIds)});
    
    return this.roleRepo.save(role);
  }

  async remove(id: number): Promise<Boolean> {
    return (await this.roleRepo.delete(id)).affected !== 0;
  }

  createRoleQueryBuilder(): QueryBuilder<Role> {
    return this.roleRepo.createQueryBuilder();
  }
}
