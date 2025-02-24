import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entities';
import { RolesModule } from '../roles/roles.module';
import { UserFactory } from './entities/user.factory';
import { TypeORMPostgresTestingModule } from '../../typeorm/configs/TypeORMPostgresTesting';

@Module({
  imports: [
    TypeORMPostgresTestingModule([]),
    TypeOrmModule.forFeature([User]),
    forwardRef(() => RolesModule),
  ],
  controllers: [UsersController,],
  providers: [UsersService, UserFactory],
  exports: [UsersService]
})
export class UsersModule {}
