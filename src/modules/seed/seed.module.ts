import { Module } from '@nestjs/common';
import { RoleModule } from '../roles/role.module';
import { UserModule } from '../users/user.module';
import { SeedService } from './seed.service';

@Module({
  imports: [UserModule, RoleModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
