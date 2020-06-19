import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as io from 'socket.io-client';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';

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
  privateMessages = [];
  usersInRoom: any;
  message: string = '';
  privateRooms = [];
  constructor(private http: HttpClient, private aRoute: ActivatedRoute, private router: Router) {
    this.socket = io('http://localhost:4000');

    this.socket.on('joined', data => {
      console.log(data)
      this.messages.push(data);
    })
    this.socket.on('left room', data => {
      this.usersInRoom = data.online;
      this.messages = data.messages ? data.messages : this.messages;
    })
    this.socket.on('usersInRoom', data => {
      this.usersInRoom = data.online;
      this.messages = data.messages
    })

    this.socket.on('message', data => {
      this.messages.push(data)
    })

    this.socket.on('createdPrivateRoom', data => {
      this.privateRooms.push(data.room);
      this.privateMessages[data.room] = data.messages;
    })
    this.socket.on('requestToJoinPrivateRoom', data => {
      this.socket.emit('joinPrivateRoom', { room: data.room })
    })
    this.socket.on('joinedPrivateRoom', data => {
      this.privateRooms.push(data.room);
      this.privateMessages[data.room] = data.messages;
    })

    this.socket.on('privateMessage', data => {
      console.log(data, data.message)
      let room = data.room;
      let messagesInRoom = this.privateMessages[room] ? this.privateMessages[room] : [];
      messagesInRoom.push(data.message);
      this.privateMessages[room] = messagesInRoom;
      console.log(this.privateMessages)
      // this.privateMessages.push(data);
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

  sendMessage(form: NgForm) {
    console.log(form)
    this.socket.emit('message', form.value.message);
    form.reset();
  }

  privateRoom(targetId) {
    this.socket.emit('makePrivateRoom', { targetId, message: this.message });
  }
  privateMessage(form: NgForm, id) {
    this.socket.emit('privateMessage', { room: id, message: form.value.message })
  }
}
