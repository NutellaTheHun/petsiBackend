import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SeedService } from '../../modules/seed/seed.service';

async function runSeedTestDb() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const seeder = app.get(SeedService);
    await seeder.seedTestDb();
    console.log('Seed Complete.');
    await app.close();
}
runSeedTestDb().catch((err) => {
    console.error(err);
    process.exit(1);
});
