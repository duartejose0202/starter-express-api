import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../core/decorators/currentUser.decorator';
import { AuthUserDto } from '../auth/auth-user.dto';
import { PostsService } from './posts.service';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';
import { CommentDocument } from './comment.document';
import { PostDocument } from './post.document';
import { plainToInstance } from 'class-transformer';

@Controller('/mobile/v1/apps/:appId/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/')
  async getPosts(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
    @Query('startAfter') startAfter?: string,
    @Query('communityId') communityId?: string,
  ) {
    let startAfterTimestamp: Timestamp = null;
    if (startAfter != null) {
      startAfterTimestamp = Timestamp.fromDate(new Date(startAfter));
    }
    return await this.postsService.getPosts(
      appId,
      startAfterTimestamp,
      communityId,
    );
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/pinned')
  async getPinnedPosts(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
    @Query('communityId') communityId?: string,
  ) {
    return await this.postsService.getPinnedPosts(appId, communityId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/:postId')
  async getPost(
    @Param('appId') appId: string,
    @Param('postId') postId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.postsService.getPost(appId, postId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/')
  async addPost(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
    @Body() post: PostDocument,
  ) {
    post = plainToInstance(PostDocument, post);
    return await this.postsService.addPost(appId, post);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/update')
  async updatePosts(
    @Param('appId') appId: string,
    @CurrentUser() user: AuthUserDto,
    @Body() body,
  ) {
    return await this.postsService.updatePosts(appId, user.id, body['name'], body['imageUrl']);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Put('/:postId')
  async updatePost(
    @Param('appId') appId: string,
    @Param('postId') postId: string,
    @CurrentUser() user: AuthUserDto,
    @Body() post: PostDocument,
  ) {
    post = plainToInstance(PostDocument, post);
    return await this.postsService.updatePost(appId, postId, post);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Delete('/:postId')
  async deletePost(
    @Param('appId') appId: string,
    @Param('postId') postId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.postsService.deletePost(appId, postId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/:postId/comments')
  async getComments(
    @Param('appId') appId: string,
    @Param('postId') postId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.postsService.getComments(appId, postId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/:postId/comments')
  async addComment(
    @Param('appId') appId: string,
    @Param('postId') postId: string,
    @Body() comment: CommentDocument,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.postsService.addComment(appId, user.id, postId, comment);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Put('/:postId/comments/:commentId')
  async updateComment(
    @Param('appId') appId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() comment: CommentDocument,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.postsService.updateComment(
      appId,
      postId,
      commentId,
      comment,
    );
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Delete('/:postId/comments/:commentId')
  async deleteComment(
    @Param('appId') appId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.postsService.deleteComment(appId, postId, commentId);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/:postId/like')
  async likePost(
    @Param('appId') appId: string,
    @Param('postId') postId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.postsService.likePost(appId, postId, user.id);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Post('/:postId/unlike')
  async unlikePost(
    @Param('appId') appId: string,
    @Param('postId') postId: string,
    @CurrentUser() user: AuthUserDto,
  ) {
    return await this.postsService.unlikePost(appId, postId, user.id);
  }
}
