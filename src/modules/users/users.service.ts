import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFactory } from './entities/user.factory';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entities';
import { In, QueryBuilder, Repository } from 'typeorm';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @Inject()
    private readonly userFactory: UserFactory,

    @Inject()
    private readonly rolesService: RolesService,
  ){}

  async create(createUserDto: CreateUserDto) {
    const alreadyExists = await this.userRepo.findOne({ where: { username: createUserDto.username }});
    if(alreadyExists){ return null; }

    const roleIds = createUserDto.roleIds || []
    const user = await this.userFactory.createEntityInstance(createUserDto, { roles: this.rolesService.findRolesById(roleIds)});
    //const {}
    
    return this.userRepo.create(user);
  }

  async findAll() {
    return await this.userRepo.find();
  }

  async findOne(id: number) {
    return await this.userRepo.findOne({ where: {id} });
  }

  async findOneByName(username: string): Promise<User | null> {
    return await this.userRepo.findOne({where : { username: username }});
  }

  async findUsersById( userIds: number[]): Promise<User[]>{
    return await this.userRepo.find({ where: { id: In(userIds) }});
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
