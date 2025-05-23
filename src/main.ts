import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './util/exceptions/global-http-exception-filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule,
        /* { logger: ['error', 'warn', 'log', 'debug'] }*/
        { bufferLogs: true, } // optional, buffers logs until logger is initialized
    );

    const config = new DocumentBuilder()
        .setTitle('PetsiBackend')
        .setDescription('Petsi CRUD API documentation')
        .addBearerAuth()
        .setVersion('1.0')
        .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

    app.useLogger(app.get(Logger));

    app.useGlobalFilters(new GlobalHttpExceptionFilter());

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
