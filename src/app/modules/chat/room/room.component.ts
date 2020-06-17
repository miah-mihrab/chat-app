import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as io from 'socket.io-client';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})
export class RoomComponent implements OnInit {

  socket;
  room;
  user;
  messages: Array<{ user: string, message: string }> = [];
  usersInRoom: any;
  message: string;
  constructor(private http: HttpClient, private aRoute: ActivatedRoute, private router: Router) {
    this.socket = io('http://localhost:4000');

    this.socket.on('joined', data => {
      console.log(data)
      this.messages.push(data);
    })
    this.socket.on('left room', data => {
      this.messages.push(data);
    })
    this.socket.on('usersInRoom', data => {
      this.usersInRoom = data;
    })

    this.socket.on('message', data => {
      this.messages.push(data)
    })
  }

  ngOnInit(): void {
    this.aRoute.queryParams.subscribe(param => {
      this.user = param.user;
      this.room = param.room;
      this.joinRoom()
    })
  }

  joinRoom() {
    this.socket.emit('join', { user: this.user, room: this.room });

  }

  leaveRoom() {
    this.socket.emit('leave', { user: this.user, room: this.room })
    this.router.navigate(['../'])
  }

  sendMessage() {
    console.log(this.message)
    this.socket.emit('message', this.message);
  }

}
