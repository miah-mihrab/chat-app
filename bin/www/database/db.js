const mongoose = require('mongoose');

mongoose
  .connect('mongodb://127.0.0.1:27017/chat-app',
    {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: true,
      useUnifiedTopology: true
    }, (err, res) => {
      if (!err) {
        console.log("DB Connected Successfully");
      }
    })
