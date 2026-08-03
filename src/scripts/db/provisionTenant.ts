import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { TenantProvisioningService } from '../../modules/tenant-provisioning/tenant-provisioning.service';

function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      args[token.slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

function requireArg(args: Record<string, string>, key: string): string {
  const value = args[key];
  if (!value) {
    throw new Error(`Missing required --${key} argument.`);
  }
  return value;
}

async function runProvisionTenant() {
  const args = parseArgs(process.argv.slice(2));

  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const provisioningService = app.get(TenantProvisioningService);

    const { tenant, location, adminUser } = await provisioningService.provisionTenant({
      tenantName: requireArg(args, 'tenantName'),
      subdomain: requireArg(args, 'subdomain'),
      locationName: requireArg(args, 'locationName'),
      locationAddress: args.locationAddress,
      locationPhoneNumber: args.locationPhoneNumber,
      locationEmail: args.locationEmail,
      adminName: requireArg(args, 'adminName'),
      adminPassword: requireArg(args, 'adminPassword'),
      adminEmail: args.adminEmail,
    });

    console.log(
      `Provisioned tenant "${tenant.name}" (id=${tenant.id}, subdomain=${tenant.subdomain}), ` +
        `location "${location.name}" (id=${location.id}), admin user "${adminUser.name}" (id=${adminUser.id}).`,
    );
  } finally {
    await app.close();
  }
}
runProvisionTenant().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
