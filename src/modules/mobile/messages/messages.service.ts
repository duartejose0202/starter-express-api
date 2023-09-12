import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { MessageDocument } from './message.document';
import { ConversationDto } from './conversation.dto';
import { PushNotificationService } from '../push-notifications/push-notification.service';
import { FirebaseApp } from 'src/modules/firestore/firebase-app.service';
import { Injectable } from '@nestjs/common';
import { FieldValue, QueryDocumentSnapshot } from '@google-cloud/firestore';

@Injectable()
export class MessagesService extends FirestoreBaseService {
  constructor(
    protected app: FirebaseApp,
    private pushService: PushNotificationService,
  ) {
    super(app);
  }

  async getMessages(appId: string, userId: string): Promise<ConversationDto[]> {
    const conversations: Map<string, ConversationDto> = new Map();

    const toMeRes = await this.getCollection(
      appId,
      MessageDocument.collectionName,
    )
      .where('toId', '==', userId)
      .get();
    let toMe = toMeRes.docs.map((doc) => doc.to(MessageDocument));

    const fromMeRes = await this.getCollection(
      appId,
      MessageDocument.collectionName,
    )
      .where('fromId', '==', userId)
      .get();
    let fromMe = fromMeRes.docs.map((doc) => doc.to(MessageDocument));

    const allMessages = [...toMe, ...fromMe];

    allMessages.forEach((m) => {
      const id = m.fromId === userId ? m.toId : m.fromId;

      let conversation = conversations.get(id);
      if (!conversation) {
        conversation = new ConversationDto();
        conversation.toId = id;
        conversation.messages = [];
        conversations.set(id, conversation);
      }
      conversation.messages.push(m);
    });

    // sort messages within each conversation
    for (let [, conversation] of conversations) {
      conversation.messages.sort((a, b) => b.time.seconds - a.time.seconds);
    }

    return Array.from(conversations.values());
  }

  async sendMessage(appId: string, msg: MessageDocument): Promise<Boolean> {
    const result = await this.getCollection(
      appId,
      MessageDocument.collectionName,
    ).add(msg);
    await this.pushService.sendMsgNotification(appId, msg);
    return true;
  }

  async readMessage(appId: string, msg: MessageDocument): Promise<Boolean> {
    const result = await this.getCollection(
      appId,
      MessageDocument.collectionName,
    ).doc(msg.id)
      .set(msg, { merge: true });
    return true;
  }
}
