import { Injectable } from '@nestjs/common';
import { FirestoreBaseService } from 'src/modules/firestore/firestore-base.service';
import { CommunityDocument } from './documents/community.document';
import { User } from '@prisma/client';
import { UserDocument } from '../users/user.document';

@Injectable()
export class CommunityService extends FirestoreBaseService {
  async addCommunity(
    appId: string,
    community: CommunityDocument,
  ): Promise<CommunityDocument> {
    const exist = await this.getCollection<CommunityDocument>(
      appId,
      CommunityDocument.collectionName,
    ).where("communityId", "==", community.communityId).get();
    if (!exist.empty) {
      await this.getCollection<CommunityDocument>(
        appId,
        CommunityDocument.collectionName,
      ).doc(exist.docs[0].id).update({
        name: community.name,
        imagePath: community.imagePath,
        isPublic: community.isPublic,
        isIcon: community.isIcon,
        icon: community.icon,
        members: community.members,
      });
      return community;
    }
    else {
      const result = await this.getCollection<CommunityDocument>(
        appId,
        CommunityDocument.collectionName,
      ).add(Object.assign({}, community));

      community.id = result.id;
      return community;
    }
  }

  async deleteCommunity(appId: string, communityId: string) {
    const match = await this.getCollection<CommunityDocument>(
      appId,
      CommunityDocument.collectionName,
    )
      .where('communityId', '==', communityId)
      .get();

    if (!match.empty) {
      await match.docs[0].ref.delete();
    }
  }

  async getCommunities(
    appId: string,
    user: User,
  ): Promise<CommunityDocument[]> {
    const communitiesDocs = await this.getCollection<CommunityDocument>(
      appId,
      CommunityDocument.collectionName,
    ).get();

    let communities = [];

    const adminRes = await this.app
      .firestore(appId)
      .collection('admins')
      .where('email', '==', user.email)

      .where('appId', '==', appId)
      .get();
    const admins = adminRes.docs.map((d) => d.data());

    if (admins.length != 0) {
      communities = communitiesDocs.docs.map((doc) =>
        doc.to(CommunityDocument),
      );
    } else {
      for (let i = 0; i < communitiesDocs.docs.length; i++) {
        const community = communitiesDocs.docs[i].to(CommunityDocument);
        if (community.userId == user.id) {
          communities.push(community);
        } else if (
          community.members != null &&
          community.members.find((e) => {
            return e.email == user.email;
          })
        ) {
          communities.push(community);
        } else if (community.isPublic) {
          communities.push(community);
        }
      }
    }

    return communities;
  }
}
