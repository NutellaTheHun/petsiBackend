import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceBase } from '../../base/service-base';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entities';
import { UserBuilder } from './user.builder';

@Injectable()
export class UserService extends ServiceBase<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly userBuilder: UserBuilder,
  ){ super(userRepo); }

  async create(createUserDto: CreateUserDto) {
    const alreadyExists = await this.findOneByName(createUserDto.username);
    if(alreadyExists){ return null; }

    const user = await this.userBuilder.buildCreateDto(createUserDto);

    const result = await this.userRepo.save(user);
    result.password = "";
    return result;
  }

  async findOneByName(username: string, relations?: string[]): Promise<User | null> {
    return await this.userRepo.findOne({where : { username: username }, relations: relations });
  }

  /**
   * Users Repository.Save(), not Repository.Update()
   */
  async update(id: number, updateUserDto: UpdateUserDto) {
    const toUpdate = await this.findOne(id);
    if(!toUpdate){ return null; }

    const user = await this.userBuilder.buildUpdateDto(toUpdate, updateUserDto);
    return await this.userRepo.save(user);
  }
}
