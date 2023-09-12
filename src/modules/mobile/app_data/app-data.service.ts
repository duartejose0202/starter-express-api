import { Injectable, NotFoundException } from '@nestjs/common';
import { AppDataDocument } from './app-data.document';
import { FirestoreBaseService } from '../../firestore/firestore-base.service';
import { StylesDocument } from './styles.document';
import { FieldPath } from '@google-cloud/firestore';
import { ProgramDocument } from "../programs/program.document";
import { Configuration, OpenAIApi } from "openai";
import { FirebaseApp } from "../../firestore/firebase-app.service";
import AppConfig from "../../../configs/app.config";
import { fontList } from "../../../constants";
import axios from "axios";

@Injectable()
export class AppDataService extends FirestoreBaseService {
  private ai: OpenAIApi;

  constructor(
    protected app: FirebaseApp,
  ) {
    super(app);
    const config = new Configuration({ apiKey: AppConfig.GPT.SECRET_KEY });
    this.ai = new OpenAIApi(config);
  }

  async copyApp(
    id: string,
    appInfo: Partial<AppDataDocument>,
    targetAppId: string
  ): Promise<void> {
    console.log("TEMPLATE ID IS " + id);
    const result = await this.getAppCollection(id).doc(id).get();
    if (!result.exists) throw new NotFoundException();

    console.log("New ID is " + targetAppId);

    await this.copyDocumentRecursive(result.ref, this.getAppCollection(targetAppId).doc(targetAppId));

    console.log(appInfo);
    await this.patchApp(targetAppId, appInfo);
  }

  async copyDocumentRecursive(sourceRef: FirebaseFirestore.DocumentReference, destRef: FirebaseFirestore.DocumentReference): Promise<void> {
    // Get the source document data
    const sourceSnapshot = await sourceRef.get();
    const sourceData = sourceSnapshot.data();

    // Set the destination document data
    const batch = this.app.firestore('default').batch();
    batch.set(destRef, sourceData);

    // Get all the subcollections of the source document
    const collections = await sourceRef.listCollections();

    // Split the subcollection copying into batches of 500
    const subCollections = collections.map((collection) => ({
      sourceCollection: sourceRef.collection(collection.id),
      destCollection: destRef.collection(collection.id),
    }));
    const batchedSubCollections = [];
    for (let i = 0; i < subCollections.length; i += 500) {
      const batchedSubCollection = subCollections.slice(i, i + 500);
      batchedSubCollections.push(batchedSubCollection);
    }

    // Copy each batch of subcollections in parallel
    await Promise.all(batchedSubCollections.map(async (batchedSubCollection) => {
      const batchedPromises = batchedSubCollection.flatMap((subCollection) => subCollection.sourceCollection.get().then((subDocs) => {
        const subDocPromises = subDocs.docs.map((subDoc) => {
          const subDocRef = subCollection.destCollection.doc(subDoc.id);
          return this.copyDocumentRecursive(subDoc.ref, subDocRef);
        });
        return Promise.all(subDocPromises);
      }));
      await Promise.all(batchedPromises);
    }));

    // Commit the batched writes
    await batch.commit();
  }

  async getAllApps(): Promise<AppDataDocument[]> {
    const apps = await this.getAppCollection('default').get();
    return apps.docs.map((doc) => doc.to(AppDataDocument));
  }

  async getAppBySlug(slug: string): Promise<AppDataDocument | null> {
    const result = await this.getAppCollection('default')
      .where('slug', '==', slug)
      .get();
    if (result.empty) {
      return null;
    } else {
      return result.docs[0].to(AppDataDocument);
    }
  }

  async checkSlug(appId: string, slug: string): Promise<boolean> {
    if (slug == null || slug.length === 0 || slug === 'app' || !/^[a-z0-9_]+$/.test(slug)) {
      return false;
    }

    const result = await this.getAppCollection('default')
      .where('slug', '==', slug)
      .where(FieldPath.documentId(), '!=', appId)
      .get();
    return result.empty;
  }

  async getAppById(id: string): Promise<AppDataDocument> | null {
    const result = await this.getAppCollection(id).doc(id).get();
    if (result.exists) {
      return result.to(AppDataDocument);
    } else {
      return null;
    }
  }

  async getAppByEmail(email: string): Promise<string> | null {
    const result = await this.app.firestore('default')
      .collection('admins')
      .where('email', '==', email)
      .get();

    if (result.empty) return null;

    return result.docs[0].data().appId;
  }

  async getPage(appId: string, pageId: string): Promise<ProgramDocument> {
    const result = await this.getCollection(
      appId,
      'pages'
    ).doc(pageId)
      .get();

    if (result.exists) {
      return result.to(ProgramDocument);
    } else {
      await this.getCollection(
        appId,
        'pages'
      ).doc(pageId)
        .set(
          { tabs: ['folder'] },
          { merge: true }
        );

      return await this.getPage(appId, pageId);
    }
  }

  async updateApp(appData: AppDataDocument): Promise<AppDataDocument> {
    try {
      await this.getAppCollection(appData.id)
        .doc(appData.id)
        .set(appData, { merge: true });
      return appData;
    } catch (e) {
      this.logger.log(e);
      throw e;
    }
  }

  async patchApp(appId: string, data: any): Promise<void> {
    await this.app.firestore(appId).collection(AppDataDocument.collectionName)
      .doc(appId)
      .set({ ...data }, { merge: true });
  }

  async getStyles(appId: string): Promise<StylesDocument> {
    const result = await this.getAppCollection(appId)
      .doc(appId)
      .collection(StylesDocument.collectionName)
      .doc(StylesDocument.documentName)
      .get();

    if (result.exists) {
      return result.to(StylesDocument);
    } else {
      return new StylesDocument();
    }
  }

  async updateStyles(
    appId: string,
    styles: StylesDocument,
  ): Promise<StylesDocument> {
    try {
      await this.getAppCollection(appId)
        .doc(appId)
        .collection(StylesDocument.collectionName)
        .doc(StylesDocument.documentName)
        .set(styles, { merge: true });
      return styles;
    } catch (e) {
      this.logger.log(e);
      throw e;
    }
  }


  async setStylesAI(appId: string, body: any) {
    const response = await this.ai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a no-code app builder and you're helping a person build an app for their " +
            "business. They are giving you information about their desired color scheme. " +
            "You should respond by using appropriate functions to set the color scheme of their app. Provide a unique, " +
            "professional color scheme. " +
            "The accent color should stick out from the rest of the colors. " +
            "Err on the side of slightly less saturated colors. " +
            "The font should be chosen from the following list: " + fontList.join(", ") + ". " +
            "If unsure which font to use, choose Poppins."
        },
        { "role": "user", "content": body['message'] },
      ],
      functions: [
        {
          name: "setColorScheme",
          description: "Sets the color scheme of the app",
          parameters: {
            type: "object",
            properties: {
              backgroundColor: {
                type: "string",
                description: "The background color of the app, formatted as a hex color code",
              },
              accentColor: {
                type: "string",
                description: "The accent color of the app, formatted as a hex color code",
              },
              cardColor: {
                type: "string",
                description: "The color for the background of cards in the app. Should be a slight variation from" +
                  " the background and good to read text from. Formatted as a hex color code",
              },
              toolbarColor: {
                type: "string",
                description: "The toolbar color of the app, formatted as a hex color code",
              },
              font: {
                type: "string",
                description: "The font of the app.",
              }
            },
            required: ["backgroundColor", "accentColor", "toolbarColor", "cardColor", "font"]
          }
        }
      ],
      max_tokens: 200
    });

    const call = response.data.choices[0].message.function_call;
    if (call.name == "setColorScheme") {
      const appInfo = {
        backgroundColor: JSON.parse(call.arguments)['backgroundColor'],
        themeColor: JSON.parse(call.arguments)['accentColor'],
        toolbarColor: JSON.parse(call.arguments)['toolbarColor'],
        cardColor: JSON.parse(call.arguments)['cardColor'],
      }
      await this.patchApp(appId, appInfo);

      const styles = {
        font: JSON.parse(call.arguments)['font'],
        displayType: 'bottomNav',
      }
      await this.updateStyles(appId, styles);
    }
  }

  async checkUrl(appId: string, url: string): Promise<any> {
    try {
      const response = await axios.get(url);
      if (response.status != 200) {
        return {
          status: 'invalid',
        };
      }

      if (response.headers['x-frame-options'] != null) {
        return {
          status: 'no_iframe',
        }
      }

      if (response.headers['content-security-policy']?.includes("frame-ancestors 'none'") === true) {
        return {
          status: 'no_iframe',
        }
      }

      return {
        status: 'ok',
      }
    } catch (e) {
      console.log(e);
      return {
        status: 'invalid',
      }
    }
  }
}
