import { Module } from "@nestjs/common";
import { CalendarController } from "./calendar.controller";
import { CalendarService } from "./calendar.service";
import { FirebaseModule } from "../../firestore/firebase.module";

@Module({
  imports: [FirebaseModule],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {
}
