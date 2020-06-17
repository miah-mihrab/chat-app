import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChatRoutingModule } from './chat-routing.module';
import { RoomComponent } from './room/room.component';
import { FormsModule } from '@angular/forms';
import { EnterRoomComponent } from './enter-room/enter-room.component';

@NgModule({
  declarations: [RoomComponent, EnterRoomComponent],
  imports: [
    CommonModule,
    ChatRoutingModule,
    FormsModule
  ]
})
export class ChatModule { }
