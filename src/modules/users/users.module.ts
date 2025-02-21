import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RolesService } from '../roles/roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    RolesService,],
  controllers: [UsersController,],
  providers: [UsersService,],
})
export class UsersModule {}
