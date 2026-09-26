import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserLocation } from '../../locations/entities/user-location.entity';
import { AppLogger } from '../../app-logging/app-logger';
import { RoleFeature } from '../../feature-flags/entities/role-feature.entity';
import { TenantFeatureService } from '../../feature-flags/services/tenant-feature.service';
import {
  computeEffectiveFeatures,
  UserRoleIdsByLocation,
} from '../../feature-flags/utils/effective-features.resolver';
import { Feature } from '../../feature-flags/utils/feature.registry';
import { RequestContextService } from '../../request-context/RequestContextService';
import { User } from '../../users/entities/user.entities';
import { isPassHashMatch } from '../utils/hash';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserLocation)
    private readonly userLocationRepo: Repository<UserLocation>,
    @InjectRepository(RoleFeature)
    private readonly roleFeatureRepo: Repository<RoleFeature>,
    private readonly tenantFeatureService: TenantFeatureService,
    private readonly jwtService: JwtService,
    private readonly configSerivce: ConfigService,
    private readonly requestContextService: RequestContextService,
    private readonly logger: AppLogger,
  ) {}

  async signIn(
    username: string,
    rawPass: string,
    tenantId: number,
  ): Promise<{ access_token: string; roles: string[]; features: string[] }> {
    const requestId = this.requestContextService.getRequestId();

    const user = await this.userRepo.findOne({
      where: { tenantId, name: username },
    });
    if (!user) {
      this.logger.logAction('Authentication', requestId, 'SIGN IN', 'FAIL', {
        requestId,
      });
      throw new UnauthorizedException('Invalid username or password');
    }

    if (!(await isPassHashMatch(rawPass, user.password))) {
      this.logger.logAction('Authentication', requestId, 'SIGN IN', 'FAIL', {
        requestId,
      });
      throw new UnauthorizedException('Invalid username or password');
    }

    // Roles are held per-location via UserLocation; build the per-location
    // claim shape the JWT payload carries, plus a flattened list for the
    // response's frontend-rendering-only `roles` field.
    const assignments = await this.userLocationRepo.find({
      where: { user: { id: user.id } },
      relations: ['roles'],
    });
    const locations = assignments.map((assignment) => ({
      locationId: assignment.locationId,
      roles: assignment.roles.map((role) => role.name),
    }));
    const roleNames = [...new Set(locations.flatMap((l) => l.roles))];

    // Same loaded Role[] data (which carries `id`, unlike the flattened
    // `roleNames` above) feeds the effective-features resolver alongside the
    // tenant's enabled features.
    const roleIds = [...new Set(assignments.flatMap((a) => a.roles.map((role) => role.id)))];
    const roleFeatureRows = roleIds.length
      ? await this.roleFeatureRepo.find({ where: { roleId: In(roleIds) } })
      : [];
    const roleGrantsByRoleId = new Map<number, Feature[]>();
    for (const row of roleFeatureRows) {
      const grants = roleGrantsByRoleId.get(row.roleId) ?? [];
      grants.push(row.feature);
      roleGrantsByRoleId.set(row.roleId, grants);
    }
    const userRoleIdsByLocation: UserRoleIdsByLocation[] = assignments.map((assignment) => ({
      locationId: assignment.locationId,
      roleIds: assignment.roles.map((role) => role.id),
    }));
    const tenantEnabledFeatures = await this.tenantFeatureService.findEnabledFeatures(tenantId);
    const features = computeEffectiveFeatures({
      tenantEnabledFeatures,
      roleGrantsByRoleId,
      userRoleIdsByLocation,
      isTenantAdmin: user.isTenantAdmin,
    });

    const payload = {
      sub: user.id,
      username: user.name,
      tenantId: user.tenantId,
      isTenantAdmin: user.isTenantAdmin,
      locations,
      features,
    };

    return {
      access_token: await this.jwtService.signAsync(payload, {
        expiresIn: '1hr',
      }),
      roles: roleNames,
      features,
    };
  }

  getJwtSecret(): string | undefined {
    return this.configSerivce.get<string>('JWT_SECRET');
  }
}
