import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  const port = Number(configService.get<string>('PORT', '3000'));

  app.enableShutdownHooks();
  app.enableCors({
    origin: parseCorsOrigin(configService.get<string>('CORS_ORIGIN', '*')),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('App Talen API')
    .setDescription(
      'API backend para autenticacion, perfiles, aprendizaje y marketplace.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}`);
  logger.log(`Swagger docs available on http://localhost:${port}/docs`);
}

function parseCorsOrigin(origin: string): boolean | string | string[] {
  if (origin === '*') {
    return true;
  }

  if (origin.includes(',')) {
    return origin.split(',').map((value) => value.trim());
  }

  return origin;
}

bootstrap();
