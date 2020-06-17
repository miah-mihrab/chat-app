import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-enter-room',
  templateUrl: './enter-room.component.html',
  styleUrls: ['./enter-room.component.css']
})
export class EnterRoomComponent implements OnInit {

  user: string;
  room: string;

  constructor() { }

  ngOnInit(): void {
  }

}
