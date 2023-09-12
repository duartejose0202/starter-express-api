import { Injectable } from '@nestjs/common';
import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { PostDocument } from './post.document';
import { firestore } from 'firebase-admin';
import { CommentDocument } from './comment.document';
import { FirebaseApp } from "../../firestore/firebase-app.service";
import { PushNotificationService } from "../push-notifications/push-notification.service";
import Timestamp = firestore.Timestamp;
import { DocumentReference } from '@google-cloud/firestore';

@Injectable()
export class PostsService extends FirestoreBaseService {
  constructor(
    protected app: FirebaseApp,
    private pushService: PushNotificationService,
  ) {
    super(app);
  }

  async getPosts(
    appId: string,
    startAfter?: Timestamp,
    communityId?: string,
  ): Promise<PostDocument[]> {
    if (startAfter == null) {
      if (communityId != null) {
        const result = await this.getCollection<PostDocument>(
          appId,
          PostDocument.collectionName,
        )
          .where('communityId', '==', communityId)
          .orderBy('time', 'desc')
          .limit(10)
          .get();

        return result.docs.map((doc) => doc.to(PostDocument));
      } else {
        const result = await this.getCollection<PostDocument>(
          appId,
          PostDocument.collectionName,
        )
          .where('communityId', '==', null)
          .orderBy('time', 'desc')
          .limit(10)
          .get();

        return result.docs.map((doc) => doc.to(PostDocument));
      }
    } else {
      if (communityId != null) {
        const result = await this.getCollection<PostDocument>(
          appId,
          PostDocument.collectionName,
        )
          .where('communityId', '==', communityId)
          .orderBy('time', 'desc')
          .startAfter(startAfter)
          .limit(10)
          .get();

        return result.docs.map((doc) => doc.to(PostDocument));
      } else {
        const result = await this.getCollection<PostDocument>(
          appId,
          PostDocument.collectionName,
        )
          .where('communityId', '==', null)
          .orderBy('time', 'desc')
          .startAfter(startAfter)
          .limit(10)
          .get();

        return result.docs.map((doc) => doc.to(PostDocument));
      }
    }
  }

  async getPost(appId: string, postId: string): Promise<PostDocument> {
    const result = await this.getCollection<PostDocument>(
      appId,
      PostDocument.collectionName,
    )
      .doc(postId)
      .get();

    return result.to(PostDocument);
  }

  async getPinnedPosts(
    appId: string,
    communityId?: string,
  ): Promise<PostDocument[]> {
    if (communityId != null) {
      const result = await this.getCollection<PostDocument>(
        appId,
        PostDocument.collectionName,
      )
        .where('communityId', '==', communityId)
        .where('isPinned', '==', true)
        .get();

      const posts = result.docs.map((doc) => doc.to(PostDocument));
      posts.sort((a, b) => b.time.seconds - a.time.seconds);
      return posts;
    } else {
      const result = await this.getCollection<PostDocument>(
        appId,
        PostDocument.collectionName,
      )
        .where('isPinned', '==', true)
        .get();

      const posts = result.docs.map((doc) => doc.to(PostDocument));
      posts.sort((a, b) => b.time.seconds - a.time.seconds);
      return posts;
    }
  }

  async updatePosts(
    appId: string,
    userId: string,
    username: string,
    imageUrl: string,
  ): Promise<void> {
    let updateData: any = {}

    if (username) {
      updateData.name = username;
    }
    if (imageUrl) {
      updateData.profilePicUrl = imageUrl;
    }

    const postQuerySnapshot = await this.getCollection<PostDocument>(appId, PostDocument.collectionName)
      .where('userId', '==', userId)
      .get();

    for (let i = 0; i < postQuerySnapshot.docs.length; i++) {
      await postQuerySnapshot.docs[i].ref.update(updateData);
      const commentQuerySnapshot = await postQuerySnapshot.docs[i].ref.collection(CommentDocument.collectionName).get();
      for (let i = 0; i < commentQuerySnapshot.docs.length; i++) {
        await commentQuerySnapshot.docs[i].ref.update(updateData);
      }
    }
  }

  async addPost(appId: string, post: PostDocument): Promise<PostDocument> {
    const result = await this.getCollection<PostDocument>(
      appId,
      PostDocument.collectionName,
    ).add(Object.assign({}, post));

    post.id = result.id;
    return post;
  }

  async updatePost(
    appId: string,
    postId: string,
    post: PostDocument,
  ): Promise<PostDocument> {
    if (post.id && post.id !== postId) {
      throw new Error('Post id mismatch');
    }

    await this.getCollection<PostDocument>(appId, PostDocument.collectionName)
      .doc(postId)
      .set(Object.assign({}, post), { merge: true });

    return post;
  }

  async deletePost(appId: string, postId: string): Promise<void> {
    const comments = await this.getCollection<PostDocument>(
      appId,
      PostDocument.collectionName,
    )
      .doc(postId)
      .collection(CommentDocument.collectionName)
      .get();

    for (const comment of comments.docs) {
      await comment.ref.delete();
    }

    await this.getCollection<PostDocument>(appId, PostDocument.collectionName)
      .doc(postId)
      .delete();
  }

  async getComments(appId: string, postId: string): Promise<CommentDocument[]> {
    const result = await this.getCollection<PostDocument>(
      appId,
      PostDocument.collectionName,
    )
      .doc(postId)
      .collection(CommentDocument.collectionName)
      .get();

    return result.docs.map((doc) => doc.to(CommentDocument));
  }

  async addComment(
    appId: string,
    userId: string,
    postId: string,
    comment: CommentDocument,
  ): Promise<CommentDocument> {
    const postResult = await this.getCollection<PostDocument>(
      appId,
      PostDocument.collectionName,
    )
      .doc(postId)
      .get();

    const post = postResult.to(PostDocument);

    const result = await postResult.ref
      .collection(CommentDocument.collectionName)
      .add(comment);

    comment.id = result.id;
    await this.getCollection<PostDocument>(appId, PostDocument.collectionName)
      .doc(postId)
      .update({
        comments: firestore.FieldValue.arrayUnion(comment.id),
      });

    await this.pushService.sendCommentNotification(
      appId,
      userId,
      post.userId,
      postId,
      post.communityId,
      comment.text,
      comment.tags
    );

    return comment;
  }

  async updateComment(
    appId: string,
    postId: string,
    commentId: string,
    comment: CommentDocument,
  ): Promise<CommentDocument> {
    if (comment.id && comment.id !== commentId) {
      throw new Error('Comment id mismatch');
    }

    await this.getCollection<PostDocument>(appId, PostDocument.collectionName)
      .doc(postId)
      .collection(CommentDocument.collectionName)
      .doc(commentId)
      .set(comment, { merge: true });

    return comment;
  }

  async deleteComment(
    appId: string,
    postId: string,
    commentId: string,
  ): Promise<void> {
    await this.getCollection<PostDocument>(appId, PostDocument.collectionName)
      .doc(postId)
      .collection(CommentDocument.collectionName)
      .doc(commentId)
      .delete();

    await this.getCollection<PostDocument>(appId, PostDocument.collectionName)
      .doc(postId)
      .update({
        comments: firestore.FieldValue.arrayRemove(commentId),
      });
  }

  async likePost(appId: string, postId: string, userId: string): Promise<void> {
    await this.getCollection<PostDocument>(appId, PostDocument.collectionName)
      .doc(postId)
      .update({
        likes: firestore.FieldValue.arrayUnion(userId),
      });

    const result = await this.getCollection<PostDocument>(appId, PostDocument.collectionName)
      .doc(postId)
      .get();

    const post = result.to(PostDocument);

    await this.pushService.sendLikeNotification(appId, userId, post.userId, post.id, post.communityId);
  }

  async unlikePost(appId: string, postId: string, userId: string): Promise<void> {
    await this.getCollection<PostDocument>(appId, PostDocument.collectionName)
      .doc(postId)
      .update({
        likes: firestore.FieldValue.arrayRemove(userId),
      });
  }
}
