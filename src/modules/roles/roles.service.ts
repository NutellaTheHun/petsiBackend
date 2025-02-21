import { Inject, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleFactory } from './entities/role.factory';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entities';
import { In, QueryBuilder, Repository } from 'typeorm';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { UsersService } from '../users/users.service';

@Injectable()
export class RolesService {
  
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @Inject()
    private readonly roleFactory: RoleFactory,

    @Inject()
    private readonly usersService: UsersService,
  ){}

  async create(createRoleDto: CreateRoleDto) {
    const alreadyExists = await this.roleRepo.findOne({ where: { name: createRoleDto.name}});
    if(alreadyExists){ return null; }

    const userIds = createRoleDto.userIds || [];
    const role = await this.roleFactory.createEntityInstance(createRoleDto, { users: this.usersService.findUsersById(userIds)});

    return this.roleRepo.create(role);
  }

  async findAll() {
    return await this.roleRepo.find();
  }

  async findOne(id: number) {
    return await this.roleRepo.findOne({ where: { id } });
  }

  async findOneByName(roleName: string) {
    return await this.roleRepo.findOne({ where: { name: roleName } });
  }

  async findRolesById( roleIds: number[]): Promise<Role[]> {
    return await this.roleRepo.find({ where: { id: In(roleIds) } });
  }

  /**
   * Id currently not used, using Repository.save for lifecycle hooks
   * @param id currently not used, using Repository.save for lifecycle hooks
   * @param roleDto 
   * @returns 
   */
  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const alreadyExists = await this.roleRepo.findOne({ where: { name: updateRoleDto.name}});
    if(!alreadyExists){ throw new ExceptionsHandler(); } //more detailed error

    const userIds = updateRoleDto.userIds || []
    const role = await this.roleFactory.updateEntityInstance(updateRoleDto, { users: this.usersService.findUsersById(userIds)});
    
    return this.roleRepo.save(role);
  }

  async remove(id: number) {
    return (await this.roleRepo.delete(id)).affected !== 0;
  }

  createRoleQueryBuilder(): QueryBuilder<Role> {
    return this.roleRepo.createQueryBuilder();
  }
}
