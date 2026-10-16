import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { AppModule } from './app.module';
import { setupApp } from './app.setup';

async function bootstrap() {
    const app = await NestFactory.create(
        AppModule,
        /*{ logger: ['error', 'warn', 'log', 'debug'] }*/
        { bufferLogs: true }, // hold startup logs until setupApp installs the pino logger
    );

    // Recommended when docker containerization
    app.enableShutdownHooks();

    // Pipe, filter and request-id middleware; first so every route (Swagger included) gets the id header
    setupApp(app);

    const config = new DocumentBuilder()
        .setTitle('PetsiBackend')
        .setDescription('Petsi CRUD API documentation')
        .addBearerAuth()
        .setVersion('1.0')
        .build();

    const configService = app.get(ConfigService);

    const apiDocPath = configService.get('API_DOC_PATH') || 'api';

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(apiDocPath, app, document);

    //writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
    if (process.env.NODE_ENV !== 'production') {
        writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
    }

    app.enableCors(); // FOR DEVELOPEMENT
    // When in production, look into this
    /*app.enableCors({
      origin:
        process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : true,
    });*/

    app.getHttpAdapter().getInstance().set('etag', false);

    //await app.listen(process.env.PORT ?? 3000);
    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
