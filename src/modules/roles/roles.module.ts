import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { UsersService } from '../users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    UsersService,],
  controllers: [RolesController,],
  providers: [RolesService,],
})
export class RolesModule {}
