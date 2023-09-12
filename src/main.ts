import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module';
import AppConfig from './configs/app.config';
import { InjectSwagger } from './core/injectors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.enableCors();
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe());
  app.enableVersioning({ type: VersioningType.URI });

  /* Add custom Injectors here */
  InjectSwagger(app);

  /* Start the application on a specified port */
  await app.listen(AppConfig.APP.PORT || 3000);
}
bootstrap();
