import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './util/exceptions/global-http-exception-filter';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    /* { logger: ['error', 'warn', 'log', 'debug'] }*/
    { bufferLogs: true }, // optional, buffers logs until logger is initialized
  );

  const config = new DocumentBuilder()
    .setTitle('PetsiBackend')
    .setDescription('Petsi CRUD API documentation')
    .addBearerAuth()
    .setVersion('1.0')
    .build();

  const configService = app.get(ConfigService);
  const apiDocPath = configService.get('API_DOC_PATH') || 'api';

  const document = SwaggerModule.createDocument(app, config);
  //console.log(JSON.stringify(document, null, 2));
  SwaggerModule.setup(apiDocPath, app, document);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  app.useLogger(app.get(Logger));

  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  app.enableCors(); // FOR DEVELOPEMENT

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
