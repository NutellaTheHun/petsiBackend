import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFactory } from './entities/user.factory';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entities';
import { Repository } from 'typeorm';
import { RolesService } from '../roles/roles.service';
import { hashPassword } from '../auth/utils/hash';
import { ServiceBase } from '../../base/service-base';

@Injectable()
export class UsersService extends ServiceBase<User> {

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly userFactory: UserFactory,

    @Inject(forwardRef(() => RolesService))
    private readonly rolesService: RolesService,
  ){ super(userRepo); }

  async create(createUserDto: CreateUserDto) {
    const alreadyExists = await this.userRepo.findOne({ where: { username: createUserDto.username }});
    if(alreadyExists){ return null; }

    const roles = await this.rolesService.findEntitiesById(createUserDto.roleIds);
    const password = await hashPassword(createUserDto.password);
    const user = await this.userFactory.createEntityInstance(createUserDto, { roles, password });
    
    const result = await this.userRepo.save(user);
    result.password = "";
    return result;
  }

  async findOneByName(username: string, relations?: string[]): Promise<User | null> {
    return await this.userRepo.findOne({where : { username: username }, relations: relations });
  }

  /**
   * Id currently not used, using Repository.save for lifecycle hooks
   * @param id currently not used, using Repository.save for lifecycle hooks
   * @param userDto 
   * @returns 
   */
  async update(id: number, updateUserDto: UpdateUserDto) {
    const alreadyExists = await this.userRepo.findOne({ where: { username: updateUserDto.username,},});
    if(!alreadyExists){ return null; }

    const roleIds = updateUserDto.roleIds || []
    const user = await this.userFactory.updateEntityInstance(updateUserDto, { roles: this.rolesService.findEntitiesById(roleIds) });

    return this.userRepo.save(user);
  }
}
