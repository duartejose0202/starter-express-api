import { FirestoreBaseService } from "../../firestore/firestore-base.service";
import { PushNotification } from "./push-notification.model";
import axios from "axios";
import { FirebaseApp } from "../../firestore/firebase-app.service";
import { decryptData } from "../../../helpers/util.helper";
import { AppsService } from "../../app/apps/apps.service";
import { MobileUsersService } from "../users/mobile-users.service";
import { PostDocument } from "../posts/post.document";
import { Injectable } from "@nestjs/common";
import { MessageDocument } from "../messages/message.document";

@Injectable()
export class PushNotificationService extends FirestoreBaseService {
  constructor(
    protected app: FirebaseApp,
    private appService: AppsService,
    private userService: MobileUsersService
  ) {
    super(app);
  }

  static readonly pushyUrl = 'https://api.pushy.me/push?api_key=';

  async getPushyKey(appId: string): Promise<string | null> {
    const app = await this.appService.getAppByFirebaseId(appId);
    if (app == null) return null;
    const encryptedKey = app.push_notification_key;
    return decryptData(encryptedKey);
  }

  async sendPushNotification(appId: string, recipient: string, notification: PushNotification) {
    const pushyKey = await this.getPushyKey(appId);
    if (pushyKey == null) throw new Error("No pushy key found for app " + appId);
    const url = PushNotificationService.pushyUrl + pushyKey;

    const response = await axios.post(url, {
      to: recipient,
      data: {
        title: notification.title,
        body: notification.body,
        page: notification.page,
        postId: notification.postId,
        communityId: notification.communityId,
        url: notification.url,
      },
      notification: {
        title: notification.title,
        body: notification.body,
        badge: 1,
        sound: 'ping.aiff'
      }
    });
  }

  async sendMsgNotification(
    appId: string,
    msg: MessageDocument,
  ) {
    try{
      let recipient;
      let sender_name;
      if (msg.fromId == "admin") {
        sender_name = "Admin";
      }
      else {
        sender_name = (await this.userService.getUserById(appId, msg.fromId)).name;
      }
      if(msg.toId == 'admin') {
        recipient = await this.userService.getUserById(appId, (await this.appService.getAppByFirebaseId(appId)).userId);
      }
      else {
        recipient = await this.userService.getUserById(appId, msg.toId);
      }

      const token = recipient?.messagingToken;
      if (token == null) throw new Error("Token not found");


      if (sender_name == null) sender_name = "Someone";

      const notification = new PushNotification();
      notification.title = `${sender_name} sent a message`;
      notification.body = msg.message;
      notification.page = "message";

      await this.sendPushNotification(appId, token, notification);
    }
    catch(ex) {
      console.log(ex);
      return null;
    }
  }

  async sendLikeNotification(
    appId: string,
    senderId: string,
    recipientId: string,
    postId: string,
    communityId?: string,
  ) {
    const recipient = await this.userService.getUserById(appId, recipientId);
    const sender = await this.userService.getUserById(appId, senderId);

    const token = recipient?.messagingToken;
    if (token == null) throw new Error("Token not found");

    let name = sender.name;
    if (name == null) name = "Someone";

    const notification = new PushNotification();
    notification.body = `${name} liked your post`;
    notification.page = "community";
    notification.postId = postId;
    notification.communityId = communityId;

    await this.sendPushNotification(appId, token, notification);
  }

  async sendCommentNotification(
    appId: string,
    senderId: string,
    recipientId: string,
    postId: string,
    communityId?: string,
    comment?: string,
    tags?: string[]
  ) {
    const recipient = await this.userService.getUserById(appId, recipientId);
    const sender = await this.userService.getUserById(appId, senderId);

    const token = recipient?.messagingToken;
    if (token == null) {
      console.log('Token not found. Not sending push to ' + recipient);
      return;
    }

    let name = sender.name;
    if (name == null) name = "Someone";

    const notification = new PushNotification();

    if (comment == null || comment === "") {
      notification.body = `${name} commented on your post`;
    } else {
      notification.body = comment.length > 70 ? `${name} commented: "${comment.substring(0, 70)}..."` : `${name} commented: "${comment}"`
    }
    notification.page = "community";
    notification.postId = postId;
    notification.communityId = communityId;

    await this.sendPushNotification(appId, token, notification);

    if (tags != null) {
      for (let tag of tags) {
        const recipient = await this.userService.getUserByName(appId, tag);
        if (recipient == null) {
          console.error("Failed to send notification to " + tag);
          continue;
        }
        const token = recipient.messagingToken;
        if (token == null) {
          console.error("Failed to send notification to " + tag);
          continue;
        }

        const tagNotification = new PushNotification();
        tagNotification.body = `${name} mentioned you in a comment`;
        tagNotification.page = "community";
        tagNotification.postId = postId;
        tagNotification.communityId = communityId;
        await this.sendPushNotification(appId, token, tagNotification);
      }
    }
  }

  async sendPostNotification(
    appId: string,
    senderId: string,
    post: PostDocument,
  ) {
    // TODO
  }
}
