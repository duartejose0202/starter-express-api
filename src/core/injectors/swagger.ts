import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export default function InjectSwagger(app: INestApplication) {
  const v1Options = new DocumentBuilder()
    .setTitle('Gameplan Mercury APIs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const v1Document = SwaggerModule.createDocument(app, v1Options);
  SwaggerModule.setup('/v1/docs', app, v1Document);
}
