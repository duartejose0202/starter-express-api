import { Injectable, Logger } from '@nestjs/common';
import * as SendGrid from '@sendgrid/mail';
import AppConfig from '../../configs/app.config';

@Injectable()
export class MailService {
  constructor() {
    SendGrid.setApiKey(AppConfig.SENDGRID.API_KEY);
  }

  async sendForgotPasswordEmail(email: string, token: string) {
    const url = `${AppConfig.APP.FRONT_END_APP_URL}/auth/reset-password?token=${token}`;
    const transport = await SendGrid.send({
      to: email,
      from: 'info@gameplanapps.com',
      templateId: AppConfig.SENDGRID.RESET_PASSWORD_EMAIL_TEMPLATE,
      dynamicTemplateData: {
        appName: 'Dashboard',
        logoUrl:
          'https://www.pngfind.com/pngs/m/80-804566_skull-logo-png-images-rh-logospng-com-cool.png',
        resetLink: url,
        supportEmail: 'email@support.com',
      },
    });
    Logger.log(transport);
  }
}
