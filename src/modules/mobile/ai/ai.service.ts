import { Injectable } from "@nestjs/common";
import { FirestoreBaseService } from "../../firestore/firestore-base.service";
import { Configuration, OpenAIApi } from "openai";
import { FirebaseApp } from "../../firestore/firebase-app.service";
import AppConfig from "../../../configs/app.config";
import { AppDataService } from "../app_data/app-data.service";
import { fontList } from "../../../constants";
import { GenerateContentDto } from "./generate-content.dto";
import axios from "axios";
import { HomeElementsService } from "../home_elements/home-elements.service";
import { ProgramsService } from "../programs/programs.service";
import { FoldersService } from "../folders/folders.service";
import { TilesService } from "../tiles/tiles.service";

@Injectable()
export class AIService extends FirestoreBaseService {
  private ai: OpenAIApi;

  constructor(
    protected app: FirebaseApp,
    private appService: AppDataService,
    private homeElementService: HomeElementsService,
    private programsService: ProgramsService,
    private foldersService: FoldersService,
    private tileService: TilesService,
  ) {
    super(app);
    const config = new Configuration({ apiKey: AppConfig.GPT.SECRET_KEY });
    this.ai = new OpenAIApi(config);
  }

  async chat(body: any) {
    console.log(body.messages);
    const response = await this.ai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 0.2,
      // @ts-ignore
      messages: [
        {
          role: "system",
          content: "You are an AI assistant for a company called AppRabbit. " +
            "You are automating the creation of a new app for a user. They will then customize it and add content. " +
            "Make sure to reassure the user that they can customize their app later. " +
            "You should find out three things. First, ask the user generally what kind of app they want to create. " +
            "Second, ask them generally about the color scheme of the app. Don't repeat back the category to the user. " +
            "Use their response to create a modern, professional color scheme for them. Err on the side of slightly less saturated colors. " +
            "Third, ask them about the name of the app. If they can't think of one, help them " +
            "come up with one based on the information they have given you. " +
            "Be helpful and resourceful. Don't ask the user for information that you already have. " +
            "After you have the information you need, call the createApp function with all the parameters filled." +
            "None of the parameters can be blank. " +
            "Users' apps can include direct messaging, a community feature, workout plans with videos, " +
            "nutrition plans with recipes, courses with text and video, any custom text, pictures, and links to " +
            "websites and products. If they ask for any features outside of this, or if they ask about anything specific " +
            "not mentioned here, tell them you aren't sure if that's " +
            "possible and they should reach out to AppRabbit for more information. "
        },
      ].concat(body['messages']),
      max_tokens: 1000,
      functions: [
        {
          name: "createApp",
          description: "Creates a new app with the given parameters",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The name of the app",
              },
              appFeatures: {
                type: "string",
                description: "Choose one feature set from the following: general fitness, personal training, nutrition, school sport, school club, school, courses, community"
              },
              backgroundColor: {
                type: "string",
                description: "The background color of the app, formatted as a hex color code",
              },
              accentColor: {
                type: "string",
                description: "The accent color of the app, formatted as a hex color code. This should stick out " +
                  "from the rest of the colors.",
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
                description: "The font of the app. Choose from the following list: " + fontList.join(", ") +
                  ". If unsure which font to use, choose Poppins.",
              }
            },
            required: ["backgroundColor", "accentColor", "toolbarColor", "cardColor", "font", "name", "appFeatures"]
          }
        }
      ],
    });

    const message = response.data.choices[0].message;

    if (message.function_call != null && message.function_call.name === "createApp") {
      console.log(message.function_call);
      return message.function_call;
    } else {
      return message;
    }
  }

  async test(body: any) {
    const imagePromptResponse = await this.ai.createChatCompletion({
      model: "gpt-3.5-turbo",
      // @ts-ignore
      messages: [
        {
          role: "user",
          content: `I am creating an app for somebody else. The app is in the ${body.appType} category. ` +
            `The app is called ${body.appName}. I asked them for additional instructions about what kind of app ` +
            `they want. This is their reply: "${body.description}". I want to search for some images that would ` +
            `make sense in the app. I would like you to come up with a search query for me to search for images. ` +
            `Please call the imageSearch function with the query as a parameter.`
        },
      ],
      max_tokens: 1000,
      functions: [
        {
          name: "imageSearch",
          description: "Calls an image API to get an image based on a simple query.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "A simple search query for the image. Should be a few words or less.",
              },
            },
            required: ["imageSearch"]
          }
        }
      ],
    });

    return imagePromptResponse.data.choices[0].message;
  }

  async generateContent(body: GenerateContentDto) {
    const imagePromptResponse = await this.ai.createChatCompletion({
      model: "gpt-3.5-turbo",
      // @ts-ignore
      messages: [
        {
          role: "user",
          content: `I am creating an app for somebody else. The app is in the ${body.appType} category. ` +
            `The app is called ${body.appName}. I asked them for additional instructions about what kind of app ` +
            `they want. This is their reply: "${body.description}". I want to search for some images that would ` +
            `make sense in the app. I would like you to come up with a search query for me to search for images. ` +
            `Please call the imageSearch function with the query as a parameter.`
        },
      ],
      max_tokens: 1000,
      functions: [
        {
          name: "imageSearch",
          description: "Calls an image API to get an image based on a simple query.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "A simple search query for the image. Should be a few words or less.",
              },
            },
            required: ["imageSearch"]
          }
        }
      ],
    });
    const args = imagePromptResponse.data.choices[0].message.function_call.arguments;
    const query = JSON.parse(args).query;
    console.log('Query', query);

    const promises = [];
    promises.push(axios.get(
      `https://api.pexels.com/v1/search?query=${query}&per_page=5&page=1&orientation=portrait`,
      {
        headers: {
          "Authorization": 'PoDA4EtRE8KADXbLEqYQfci5F9bj1i9ljPEBQv8LVIHqycIqyk5gbWgk',
        },
      }
    ));
    promises.push(axios.get(
      `https://api.pexels.com/v1/search?query=${query}&per_page=5&page=1&orientation=landscape`,
      {
        headers: {
          "Authorization": 'PoDA4EtRE8KADXbLEqYQfci5F9bj1i9ljPEBQv8LVIHqycIqyk5gbWgk',
        },
      }
    ));

    const imageResponses = await Promise.all(promises);

    const appData = {
      name: body.appName,
      slug: body.appName.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
      backgroundColor: body.design['backgroundColor'],
      themeColor: body.design['themeColor'],
      toolbarColor: body.design['toolbarColor'],
      cardColor: body.design['cardColor'],
      logoUrl: body.logoUrl,
      splashScreenUrl: imageResponses[0].data.photos[0].src.large,
    };

    let removeMessaging = false;
    let removeCommunity = false;
    let removeNutrition = false;
    let turnOffCoaching = false;

    let template;
    if (body.appType === 'fitness') {
      if (!body.responses.includes('community')) {
        removeCommunity = true;
      }

      if (!body.responses.includes('nutrition')) {
        removeNutrition = true;
      }

      if (body.responses.includes('nutrition') && !body.responses.includes('private_programs') && !body.responses.includes('public_programs')) {
        template = 'nutritionFitnessTemplate';
      } else if (body.responses.includes('private_programs')) {
        template = 'trainingFitnessTemplate';
      } else if (body.responses.includes('public_programs')) {
        template = 'programsFitnessTemplate';
        turnOffCoaching = true;
        removeMessaging = true;
      } else {
        turnOffCoaching = true;
        removeMessaging = true;
        template = 'programsFitnessTemplate';
      }
    } else if (body.appType === 'school') {
      appData['free'] = true;
      turnOffCoaching = true;
      if (body.responses.includes('school_clubs') && !body.responses.includes('school_sports')) {
        template = 'clubSchoolTemplate';
      } else if (body.responses.includes('school_sports') && !body.responses.includes('school_clubs')) {
        template = 'sportSchoolTemplate';
      } else {
        template = 'entireSchoolTemplate';
      }
    } else if (body.appType === 'courses' || body.appType === 'community') {
      turnOffCoaching = true;

      if (!body.responses.includes('messaging')) {
        removeMessaging = true;
      }

      if (body.responses.includes('courses')) {
        if (!body.responses.includes('community')) {
          removeCommunity = true;
        }
        template = 'courseCommunityTemplate';
      } else {
        template = 'masterCommunityTemplate';
      }
    }

    if (turnOffCoaching) {
      appData['coaching'] = false;
      appData['showUserProfile'] = false;
    }

    await this.appService.copyApp(template, {}, body.appId);

    const finalPromises = [];
    finalPromises.push(this.appService.patchApp(body.appId, appData));
    const styles = {
      font: 'Poppins',
      displayType: 'bottomNav',
      lightenSplash: true,
      showLogoOnSplash: true
    }
    finalPromises.push(this.appService.updateStyles(body.appId, styles));
    if (removeMessaging || removeCommunity || removeNutrition) {
      const features = await this.homeElementService.getHomeElements(body.appId);
      const messagingFeatures = features.filter(feature => feature.type === 'messaging');
      const communityFeatures = features.filter(feature => feature.type === 'community');
      const nutritionFeatures = features.filter(feature => feature.type === 'nutrition');
      if (removeMessaging && messagingFeatures.length !== 0) {
        finalPromises.push(this.homeElementService.deleteHomeElement(body.appId, messagingFeatures[0].id));
      }
      if (removeCommunity && communityFeatures.length !== 0) {
        finalPromises.push(this.homeElementService.deleteHomeElement(body.appId, communityFeatures[0].id));
      }
      if (removeNutrition && nutritionFeatures.length !== 0) {
        finalPromises.push(this.homeElementService.deleteHomeElement(body.appId, nutritionFeatures[0].id));
      }
    }

    const programs = await this.programsService.getAllPrograms(body.appId);
    let homePrograms = programs.filter(program => {
      return (program.customerId == null && program.customers.length === 0) ||
        program.customerId === 'default';
    });
    homePrograms = homePrograms.sort((a, b) => {
      return a.order - b.order;
    });
    const alteredProgram = homePrograms[0];
    console.log(alteredProgram.title);

    alteredProgram.imageUrl = imageResponses[1].data.photos[0].src.medium;
    alteredProgram.thumbnail = imageResponses[1].data.photos[0].src.small;

    finalPromises.push(this.programsService.updateProgram(body.appId, alteredProgram.id, { ...alteredProgram }));

    if (body.design['theme'] === 'dark') {
      const defaultFolder = programs.find(program => program.id === 'default');
      if (defaultFolder) {
        finalPromises.push(this.updateTextTileColors(body.appId));
      }
    }

    await Promise.all(finalPromises);
  }

  async updateTextTileColors(appId: string) {
    const items = await this.foldersService.getItems(appId, 'default');
    const textItems = items.filter(item => item.type === 'text');
    if (textItems.length !== 0) {
      const textItem = textItems[0];
      const tiles = await this.tileService.getTextTiles(appId);
      const tile = tiles.find(tile => tile.id === textItem.itemId);
      if (tile) {
        tile.text.replace(/#000000/g, '#ffffff');
        await this.tileService.updateTextTile(appId, tile.id, tile);
      }
    }
  }

  async getName(prompt: string) {
    const imagePromptResponse = await this.ai.createChatCompletion({
      model: "gpt-3.5-turbo",
      // @ts-ignore
      messages: [
        {
          role: "user",
          content: `I am creating an app for somebody else. I asked them for an overview of what kind of app ` +
            `they want. This is their reply: "${prompt}". Did they include their app's name in their reply? ` +
            `Please call the populateName function with the app's name as a parameter. If they did not include ` +
            `their app's name, please call the populateName function with an empty string as a parameter.`
        },
      ],
      max_tokens: 1000,
      functions: [
        {
          name: "populateName",
          description: "Populates the app's name.",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "The name of the app, or an empty string if the name was not specified.",
              },
            },
            required: ["name"]
          }
        }
      ],
    });
    const args = imagePromptResponse.data.choices[0].message.function_call.arguments;
    const name = JSON.parse(args).name;
    console.log('Name', name);
    return {
      appName: name,
    };
  }

  async create(body: any) {
    const call = body['call'];
    const appId = body['appId'];

    const appData = {
      name: JSON.parse(call.arguments)['name'],
      slug: JSON.parse(call.arguments)['name'].toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
      backgroundColor: JSON.parse(call.arguments)['backgroundColor'],
      themeColor: JSON.parse(call.arguments)['accentColor'],
      toolbarColor: JSON.parse(call.arguments)['toolbarColor'],
      cardColor: JSON.parse(call.arguments)['cardColor'],
      logoUrl: body['logoUrl'],
    }

    const category = JSON.parse(call.arguments)['appFeatures'];
    let template = 'courseCommunityTemplate';
    switch (category) {
      case 'general fitness':
        template = 'programsFitnessTemplate';
        break;
      case 'personal training':
        template = 'trainingFitnessTemplate';
        break;
      case 'nutrition':
        template = 'nutritionFitnessTemplate';
        break;
      case 'school sport':
        template = 'sportSchoolTemplate';
        break;
      case 'school club':
        template = 'clubSchoolTemplate';
        break;
      case 'school':
        template = 'entireSchoolTemplate';
        break;
      case 'courses':
        template = 'courseCommunityTemplate';
        break;
      case 'community':
        template = 'masterCommunityTemplate';
    }

    await this.appService.copyApp(template, {}, appId);
    await this.appService.patchApp(appId, appData);
    const styles = {
      font: JSON.parse(call.arguments)['font'],
      displayType: 'bottomNav',
    }
    await this.appService.updateStyles(appId, styles);
  }
}
