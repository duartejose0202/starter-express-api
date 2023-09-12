import { MessageDocument } from './message.document';

export class ConversationDto {
  toId: string;
  messages: MessageDocument[];
}
