import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';

async function clearTestDb() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dataSource = app.get(DataSource);

    // check environment + db name before clearing
    const nodeEnv = process.env.NODE_ENV;
    const dbName = dataSource.options.database;

    if (
      nodeEnv !== 'development' ||
      typeof dbName !== 'string' ||
      !dbName.toLowerCase().includes('petsiTest'.toLowerCase())
    ) {
      throw new Error(
        `Refusing to clear database. NODE_ENV=${nodeEnv}, database=${dbName}`,
      );
    }

    console.log(`Clearing database: ${dbName}`);

    // Drop schema (wipe everything)
    await dataSource.dropDatabase();
    await dataSource.synchronize(); // rebuild schema

    console.log(`✅ Database cleared: ${dbName}`);
  } catch (err) {
    console.error(err);
  } finally {
    await app.close();
  }
}
clearTestDb();
