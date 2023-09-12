import { Body, Controller, Post } from '@nestjs/common';
import { AIService } from './ai.service';
import { GenerateContentDto } from "./generate-content.dto";

@Controller('/mobile/v1/ai')
export class AIController {

  constructor(private readonly aiService: AIService) {}

  @Post('/chat')
  async chat(
    @Body() body: any,
  ) {
    return this.aiService.chat(body);
  }

  @Post('/name')
  async getName(
    @Body() body: any,
  ) {
    return this.aiService.getName(body['description']);
  }

  @Post('/create')
  async createNewApp(
    @Body() body: GenerateContentDto,
  ) {
    return this.aiService.generateContent(body);
  }
}
