import { INestApplication } from '@nestjs/common';
import { TranslatorService } from 'nestjs-translator';
import { ResponseInterceptor } from '../interceptors/response.interceptor';
import { NewrelicInterceptor } from '../interceptors/newrelic.interceptor';

export default function InjectInterceptors(app: INestApplication) {
  app.useGlobalInterceptors(
    new ResponseInterceptor(app.get(TranslatorService)),
    new NewrelicInterceptor(),
  );
}
