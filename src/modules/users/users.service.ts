import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFactory } from './entities/user.factory';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entities';
import { In, QueryBuilder, Repository } from 'typeorm';
import { RolesService } from '../roles/roles.service';
import { hashPassword } from '../auth/utils/hash';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly userFactory: UserFactory,

    @Inject(forwardRef(() => RolesService))
    private readonly rolesService: RolesService,
  ){}

  async create(createUserDto: CreateUserDto) {
    const alreadyExists = await this.userRepo.findOne({ where: { username: createUserDto.username }});
    if(alreadyExists){ return null; }

    const roles = await this.rolesService.findRolesById(createUserDto.roleIds);
    const password = await hashPassword(createUserDto.password);
    const user = await this.userFactory.createEntityInstance(createUserDto, { roles, password });
    
    const result = await this.userRepo.save(user);
    result.password = "";
    return result;
  }

  async findAll(relations?: string[]) {
    return await this.userRepo.find({ relations: relations });
  }

  async findOne(id: number, relations?: string[]) {
    return await this.userRepo.findOne({ where: {id}, relations: relations });
  }

  async findOneByName(username: string, relations?: string[]): Promise<User | null> {
    return await this.userRepo.findOne({where : { username: username }, relations: relations });
  }

  async findUsersById( userIds: number[], relations?: string[]): Promise<User[]>{
    return await this.userRepo.find({ where: { id: In(userIds) }, relations: relations });
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
    const user = await this.userFactory.updateEntityInstance(updateUserDto, { roles: this.rolesService.findRolesById(roleIds) });

    return this.userRepo.save(user);
  }

  async remove(id: number) {
    return (await this.userRepo.delete(id)).affected !== 0;
  }

  createUserQueryBuilder(): QueryBuilder<User> {
    return this.userRepo.createQueryBuilder();
  }
}
