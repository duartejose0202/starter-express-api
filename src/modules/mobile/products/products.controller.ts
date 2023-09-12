import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { FirebaseAuthGuard } from "../../../core/guards/firebase-auth.guard";
import { ProductCategoryDocument, ProductDocument } from "./product.document";
import { ReorderDto } from "../shared/dtos/reorder.dto";

@Controller('/mobile/v1/apps/:appId/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/categories')
  async getProducts(
    @Param('appId') appId: string,
  ) {
    return await this.productsService.getProductCategories(appId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/categories')
  async addProductCategory(
    @Param('appId') appId: string,
    @Body() category: ProductCategoryDocument,
  ) {
    return await this.productsService.addProductCategory(appId, category);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/categories/:categoryId')
  async updateProductCategory(
    @Param('appId') appId: string,
    @Param('categoryId') categoryId: string,
    @Body() category: ProductCategoryDocument,
  ) {
    return await this.productsService.updateProductCategory(appId, categoryId, category);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Delete('/categories/:categoryId')
  async deleteProductCategory(
    @Param('appId') appId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return await this.productsService.deleteProductCategory(appId, categoryId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/categories/reorder')
  async reorderProductCategories(
    @Param('appId') appId: string,
    @Body() data: ReorderDto,
  ) {
    return await this.productsService.reorderProductCategories(appId, data);
  }

  @UseGuards(FirebaseAuthGuard('AppUser'))
  @Get('/')
  async getProductsInCategory(
    @Param('appId') appId: string,
    @Query('categoryId') categoryId: string,
  ) {
    return await this.productsService.getProductsInCategory(appId, categoryId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/categories/:categoryId')
  async addProduct(
    @Param('appId') appId: string,
    @Param('categoryId') categoryId: string,
    @Body() product: ProductDocument,
  ) {
    return await this.productsService.addProduct(appId, categoryId, product);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Put('/categories/:categoryId/products/:productId')
  async updateProduct(
    @Param('appId') appId: string,
    @Param('categoryId') categoryId: string,
    @Param('productId') productId: string,
    @Body() product: ProductDocument,
  ) {
    return await this.productsService.updateProduct(appId, categoryId, productId, product);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Delete('/categories/:categoryId/products/:productId')
  async deleteProduct(
    @Param('appId') appId: string,
    @Param('categoryId') categoryId: string,
    @Param('productId') productId: string,
  ) {
    return await this.productsService.deleteProduct(appId, categoryId, productId);
  }

  @UseGuards(FirebaseAuthGuard('AppOwner'))
  @Post('/categories/:categoryId/reorder')
  async reorderProducts(
    @Param('appId') appId: string,
    @Param('categoryId') categoryId: string,
    @Body() data: ReorderDto,
  ) {
    return await this.productsService.reorderProducts(appId, categoryId, data);
  }
}
