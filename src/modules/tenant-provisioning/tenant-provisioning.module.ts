import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../locations/entities/location.entity';
import { Role } from '../roles/entities/role.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entities';
import { TenantProvisioningService } from './tenant-provisioning.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, Location, Role, User])],
  providers: [TenantProvisioningService],
  exports: [TenantProvisioningService],
})
export class TenantProvisioningModule {}
