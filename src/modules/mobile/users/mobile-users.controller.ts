import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserDocument } from './user.document';
import { MobileUsersService } from './mobile-users.service';
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';
import { ProgressDocument } from './progress.document';
import { CurrentUser } from '../../../core/decorators/currentUser.decorator';
import { SwapDocument } from './swap.document';
import { FavoriteDocument } from './favorite.document';
import { plainToInstance } from 'class-transformer';
import { UserCreationDto } from './user-creation.dto';

@Controller('/mobile/v1/apps/:appId/user')
export class MobileUsersController {
  constructor(private readonly usersService: MobileUsersService) {}

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/me')
  async getUser(
    @Param('appId') appId: string,
    @CurrentUser() user,
  ): Promise<UserDocument> {
    const userData = await this.usersService.getUserData(appId, user.id);

    if (userData == null) throw new NotFoundException();

    // TODO handle this as its own endpoint
    // if (userData.unpaid === false && (userData.paymentMethod == "google" || userData.paymentMethod == "apple")) {
    //   if (userData.verificationData != null) {
    //     const response = await admin. .httpsCallable("validateReceipt").call({
    //       "subscription": userData.subscription,
    //       "platform": userData.paymentMethod,
    //       "receipt": userData.verificationData,
    //     });
    //     if (response.data["isValid"] != true) {
    //       userData.unpaid = true;
    //     }
    //   }
    // }

    return userData;
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/addNewClient')
  async addNewClient(
    @Param('appId') appId: string,
    @CurrentUser() user,
    @Body() userData: UserCreationDto,
  ): Promise<void> {
    await this.usersService.createSubscription({
      appId: appId,
      email: userData.email,
      stripeCustomerId: userData.stripeCustomerId,
      subscriptionId: userData.subscriptionId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: userData.password,
      isAllPlans: userData.isAllPlans,
      productList: [],
    });
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Put('/me')
  async saveUserData(
    @Param('appId') appId: string,
    @Body() userData: Partial<UserDocument>,
    @CurrentUser() user,
  ) {
    await this.usersService.saveUserData(appId, user.id, userData);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/:userId')
  async saveOtherUserData(
    @Param('appId') appId: string,
    @Param('userId') userId: string,
    @Body() userData: Partial<UserDocument>,
  ) {
    await this.usersService.saveUserData(appId, userId, userData);
  }

  @Post('/me')
  async createUser(
    @Param('appId') appId: string,
    @Body() userData: UserDocument,
    @CurrentUser() user,
  ) {
    await this.usersService.createUser(appId, userData);
  }

  // TODO handle coach version of this
  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Get('/all')
  async getAllUsers(@Param('appId') appId: string): Promise<UserDocument[]> {
    return await this.usersService.getAllUsers(appId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Delete('/:userId')
  async deleteUser(
    @Param('appId') appId: string,
    @Param('userId') userId: string,
  ) {
    await this.usersService.deleteUser(appId, userId);
  }

  @Get('/exists')
  async getUserExists(
    @Param('appId') appId: string,
    @Query('email') email: string,
  ) {
    const exists = await this.usersService.getUserExists(appId, email);
    return {
      exists,
    };
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/role')
  async getRole(@Param('appId') appId: string, @CurrentUser() user) {
    const role = await this.usersService.getUserRole(user.email, appId);
    return {
      role,
    };
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/progress')
  async addProgress(
    @Param('appId') appId: string,
    @Body() progress: ProgressDocument,
    @CurrentUser() user,
  ) {
    progress = plainToInstance(ProgressDocument, progress);
    await this.usersService.addUserProgress(appId, user.id, progress);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/progress/:itemId')
  async getProgress(
    @Param('appId') appId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user,
  ): Promise<Partial<ProgressDocument>> {
    const progress = await this.usersService.getProgressForItem(
      appId,
      user.id,
      itemId,
    );
    if (progress == null) {
      return {};
    } else {
      return progress;
    }
  }

  // Swap endpoints
  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/swaps')
  async getSwaps(@Param('appId') appId: string, @CurrentUser() user) {
    return await this.usersService.getSwaps(appId, user.id);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/swaps')
  async addSwap(
    @Param('appId') appId: string,
    @CurrentUser() user,
    @Body() swap: SwapDocument,
  ) {
    return await this.usersService.addSwap(appId, user.id, swap);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Delete('/swaps/:swapId')
  async deleteSwap(
    @Param('appId') appId: string,
    @CurrentUser() user,
    @Param('swapId') swapId: string,
  ) {
    return await this.usersService.deleteSwap(appId, user.id, swapId);
  }

  // Favorite endpoints
  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/favorites')
  async getFavorites(
    @Param('appId') appId: string,
    @CurrentUser() user,
    @Query('type') type?: string,
  ) {
    return await this.usersService.getFavorites(appId, user.id, type);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/favorites')
  async addFavorite(
    @Param('appId') appId: string,
    @CurrentUser() user,
    @Body() favorite: FavoriteDocument,
  ) {
    return await this.usersService.addFavorite(appId, user.id, favorite);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Delete('/favorites/:itemId')
  async deleteFavorites(
    @Param('appId') appId: string,
    @CurrentUser() user,
    @Param('itemId') itemId: string,
  ) {
    return await this.usersService.deleteFavorite(appId, user.id, itemId);
  }
}
