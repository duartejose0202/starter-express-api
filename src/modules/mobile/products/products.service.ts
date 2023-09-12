import { Injectable } from "@nestjs/common";
import { FirestoreBaseService } from "../../firestore/firestore-base.service";
import { ProductCategoryDocument, ProductDocument } from "./product.document";
import { ReorderDto } from "../shared/dtos/reorder.dto";

@Injectable()
export class ProductsService extends FirestoreBaseService {
  async getProductCategories(appId: string) {
    const response = await this.getCollection(
      appId,
      ProductCategoryDocument.collectionName
    ).get();
    return response.docs.map((doc) => doc.to(ProductCategoryDocument));
  }

  async addProductCategory(appId: string, category: ProductCategoryDocument) {
    const response = await this.getCollection(
      appId,
      ProductCategoryDocument.collectionName
    ).add(category);

    category.id = response.id;
    category.path = response.path;

    return category;
  }

  async updateProductCategory(appId: string, categoryId: string, category: ProductCategoryDocument) {
    if (category.id != categoryId) {
      throw new Error('Category id does not match');
    }

    await this.getCollection(
      appId,
      ProductCategoryDocument.collectionName
    ).doc(categoryId).set(category, { merge: true });

    return category;
  }

  async deleteProductCategory(appId: string, categoryId: string) {
    await this.getCollection(
      appId,
      ProductCategoryDocument.collectionName
    ).doc(categoryId).delete();
  }

  async reorderProductCategories(appId: string, data: ReorderDto) {
    const batch = this.app.firestore(appId).batch();

    const collection = this.getCollection(
      appId,
      ProductCategoryDocument.collectionName
    );

    data.ids.forEach((id, index) => {
      batch.update(collection.doc(id), { order: index });
    });

    await batch.commit();
  }

  async getProductsInCategory(appId: string, categoryId: string) {
    const response = await this
      .getCollection(appId, ProductCategoryDocument.collectionName)
      .doc(categoryId)
      .collection(ProductDocument.collectionName)
      .get();

    return response.docs.map((doc) => doc.to(ProductDocument));
  }

  async addProduct(appId: string, categoryId: string, product: ProductDocument) {
    const response = await this
      .getCollection(appId, ProductCategoryDocument.collectionName)
      .doc(categoryId)
      .collection(ProductDocument.collectionName)
      .add(product);

    product.id = response.id;
    product.path = response.path;

    return product;
  }

  async updateProduct(appId: string, categoryId: string, productId: string, product: ProductDocument) {
    if (product.id != productId) {
      throw new Error('Product id does not match');
    }

    await this
      .getCollection(appId, ProductCategoryDocument.collectionName)
      .doc(categoryId)
      .collection(ProductDocument.collectionName)
      .doc(productId)
      .set(product, { merge: true });

    return product;
  }

  async deleteProduct(appId: string, categoryId: string, productId: string) {
    await this
      .getCollection(appId, ProductCategoryDocument.collectionName)
      .doc(categoryId)
      .collection(ProductDocument.collectionName)
      .doc(productId)
      .delete();
  }

  async reorderProducts(appId: string, categoryId: string, data: ReorderDto) {
    const batch = this.app.firestore(appId).batch();

    const collection = this
      .getCollection(appId, ProductCategoryDocument.collectionName)
      .doc(categoryId)
      .collection(ProductDocument.collectionName);

    data.ids.forEach((id, index) => {
      batch.update(collection.doc(id), { order: index });
    });

    await batch.commit();
  }
}
