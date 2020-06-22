import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as io from 'socket.io-client';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Title } from '@angular/platform-browser';

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
  newMessage = 0;
  title: 'Chat App'
  dataUrl = '';

  hidden;
  visibilityChange;
  file: any;


  constructor(private titleAngular: Title, private aRoute: ActivatedRoute, private router: Router) {
    this.socket = io('http://localhost:4000');

    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
      this.hidden = "hidden";
      this.visibilityChange = "visibilitychange";
    }

    document.addEventListener(this.visibilityChange, () => {
      if (!document.hidden) {
        this.newMessage = 0;
        titleAngular.setTitle(`Chat App`)
      }
    });



    this.socket.on('joined', data => {
      console.log(data, "DAAAAta")
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
      if (data.new_message && document.hidden) {
        this.newMessage++; titleAngular.setTitle(`Chat App (${this.newMessage})`)
      }
    })

    this.socket.on('createdPrivateRoom', data => {
      console.log(data, "JOINED")

      this.privateRooms.push({ id: data.room, targetUser: data.targetUser });
      this.privateMessages[data.room] = data.messages;
    })
    this.socket.on('requestToJoinPrivateRoom', data => {
      console.log("DATA", data)
      this.socket.emit('joinPrivateRoom', { room: data.room, targetUser: data.targetUser })
    })
    this.socket.on('joinedPrivateRoom', data => {
      console.log(data, "JOINED")
      this.privateRooms.push({ id: data.room, targetUser: data.targetUser });
      this.privateMessages[data.room] = data.messages;
    })

    this.socket.on('privateMessage', data => {
      console.log(data, data.message)
      let room = data.room;
      let messagesInRoom = this.privateMessages[room] ? this.privateMessages[room] : [];
      messagesInRoom.push(data.message);
      this.privateMessages[room] = messagesInRoom;
      if (data.new_message && document.hidden) {
        this.newMessage++; titleAngular.setTitle(`Chat App (${this.newMessage})`)
      }
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

  sendMessage(form: NgForm, room) {
    console.log(this.dataUrl)
    this.socket.emit('message', { message: form.value.message, room, file: this.dataUrl });
    form.reset();
  }

  privateRoom(targetId) {
    this.socket.emit('makePrivateRoom', { targetId, message: this.message });
  }
  privateMessage(form: NgForm, id) {
    console.log(form.value)
    this.socket.emit('privateMessage', { room: id, message: form.value.message })
  }

  fileAdded(fl) {
    this.file = fl.target.files[0]
    const reader = new FileReader();
    let dataUrl;
    reader.addEventListener("load", () => {
      this.dataUrl = (<string>reader.result).split('data:image/jpeg;base64,')[1] || (<string>reader.result).split('data:image/jpg;base64,')[1] || (<string>reader.result).split('data:image/png;base64,')[1]
      return dataUrl;
    }, false);

    if (this.file) {
      reader.readAsDataURL(this.file);
      console.log(this.dataUrl)
    }
  }
}
