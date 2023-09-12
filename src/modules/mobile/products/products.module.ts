import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { FirebaseModule } from "../../firestore/firebase.module";

@Module({
  imports: [FirebaseModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {
}
