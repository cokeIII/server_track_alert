var mysql      = require('mysql');
var express    = require("express");
var express = require('express');
var bodyParser = require('body-parser');


var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'track_alert'
});
var app = express();
app.use(bodyParser.json());
connection.connect(function(err){
if(!err) {
    console.log("Database is connected ... nn");    
} else {
    console.log("Error connecting database ... nn");    
}
});

app.get("/maps",function(req,res){
connection.query('SELECT * from maps', function(err, rows, fields) {
  if (!err){
    var data = {
      maps:rows
    }
    //console.log('The solution is: ', rows);
    res.json(data);
  }
  else
    console.log('Error while performing Query.');
  });
});

app.post("/insertUser",function(req,res){
  let insertRow = 0
  connection.query('SELECT * from users where user_id = "'+req.body.idCard+'"', function(err, rows, fields) {
    if (!err){
      console.log(rows)
      if(rows.length == 0){
        connection.query('insert into users (user_id,name,phone_number,device_id) values("'+req.body.idCard+'","'+req.body.userName+'","'+req.body.phoneNumber+'","'+req.body.deviceId+'")', function(err, result) {
          if (!err){
            if(result.affectedRows)
            res.json({status: "Success"})
          }
          else
            res.json({status: "Fail"})
        });  
      } else 
        res.json({status:"DuplicateUser"})
    }
    else{
      console.log('Error while performing Query.')
    }
  });

});


app.listen(3001);
// connection.end();