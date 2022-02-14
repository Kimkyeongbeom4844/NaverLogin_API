const express = require('express');
const url = require('url');
const fs = require('fs');
const mysql = require('mysql');
const secret = require('./secret');// ./secret.js와 동일
let request = require('request');
let app = express();
let client_id = secret.client_id;
let client_secret = secret.client_secret;
let state = Math.round(Math.random()*100000000); //Math.round메소드 -> 소수점이하 반올림
let redirectURI = encodeURI("http://127.0.0.1:3000/callback");
let api_url = "";
let token = "";
let accesstoken = "";
let userID = "";
let refresh_url = "";
let refresh_token = "";
// let header = "Bearer " + token; //왜 header라고 쓰면 오류가 뜨지?? 스코프 차이인가???

const db = mysql.createConnection(
  {
    host : '127.0.0.1',
    user : 'root',
    password : secret.db_password,
    database : 'users'
  }
)
db.connect();
// db.query( ,(err,xxx)=>{})
// db.end();

app.get('/', function (req, res) {
  api_url = 'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=' + client_id + '&redirect_uri=' + redirectURI + '&state=' + state;
  res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
  res.end(`<a href='${api_url}'><img height='50' src='http://static.nid.naver.com/oauth/small_g_in.PNG'/></a>`);
});
app.get('/callback', function (req, res) {
  code = req.query.code;
  state = req.query.state;
  api_url = 'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id='
  + client_id + '&client_secret=' + client_secret + '&redirect_uri=' + redirectURI + '&code=' + code + '&state=' + state;
  let options = {
    url: api_url,
    headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
  };
  request.get(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log('-------------------Token Info-------------------');
      token = JSON.parse(body);
      console.log(token);
      accesstoken = String(JSON.parse(body).access_token);
      refresh_token = JSON.parse(body).refresh_token;
      res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
      res.end(`<a href="/expire">로그아웃</a><br><a href="/member">회원정보조회</a>`); 
    } 
    else {
      res.write("<script>alert('재접속하십시오')</script>");
      res.writeHead(302,{Location : `/`});
      res.end();
    }
  });
});
app.get('/expire', function (req, res) {
  //console.log(accesstoken); 접근토큰에 + 기호를 띄어쓰기로 인식할때는 토큰 파괴가 안됨
  let expire_url = `https://nid.naver.com/oauth2.0/token?grant_type=delete&client_id=${client_id}&client_secret=${client_secret}&access_token=${accesstoken}&service_provider=NAVER`;
  let options = {
    url: expire_url
  };
  request.get(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.writeHead(302,{Location : `https://nid.naver.com/oauth2.0/authorize?response_type=code&state=${state}&redirect_uri=${redirectURI}&client_id=${client_id}&oauth_os=&inapp_view=&locale=ko_KR&auth_type=reauthenticate`});
      res.end();
    } else {
      res.write(`<script>alert('장시간 자리를 비워 로그아웃되셨습니다.<br>다시 로그인하시길 바랍니다')</script>`);
      res.writeHead(302,{Location : `https://nid.naver.com/oauth2.0/authorize?response_type=code&state=${state}&redirect_uri=${redirectURI}&client_id=${client_id}&oauth_os=&inapp_view=&locale=ko_KR&auth_type=reauthenticate`});
      res.end();
    }
  });
});
app.get('/member', function (req, res) {
  let api_url = 'https://openapi.naver.com/v1/nid/me';
  let options = {
    url: api_url,
    headers: {'Authorization': "Bearer " + accesstoken}
  };
  request.get(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
      res.end(`<a href="/main">메인으로<a>`);
      console.log('-------------------User Info-------------------');
      userID = JSON.parse(body).response.id;
      userName = JSON.parse(body).response.name;
      console.log(JSON.parse(body));
      db.query(`insert into userinfo (id,name,접근시간) values('${userID}','${userName}',now())`,function(err,xxx){
        if(err){
          console.error(err);
        }
        console.log('유저 정보 추가');
      })
    } else {
      res.write(`<script>alert('장시간 자리를 비워 로그아웃되셨습니다.<br>다시 로그인하시길 바랍니다')</script>`);
      res.writeHead(302,{Location : `https://nid.naver.com/oauth2.0/authorize?response_type=code&state=${state}&redirect_uri=${redirectURI}&client_id=${client_id}&oauth_os=&inapp_view=&locale=ko_KR&auth_type=reauthenticate`});
      res.end();
    }
  });
});
app.get('/main',function(req,res){
    refresh_url = `https://nid.naver.com/oauth2.0/token?grant_type=refresh_token&client_id=${client_id}&client_secret=${client_secret}&refresh_token=${refresh_token}`;
    let options = {
      url: refresh_url,
    };
    request.get(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
      res.end(`<a href="/expire">로그아웃</a><br><a href="/member">회원정보조회</a>`);
      console.log('-------------------token refresh-------------------');
      console.log(JSON.parse(body));
      accesstoken = JSON.parse(body).access_token;
    } else {
      res.write(`<script>alert('장시간 자리를 비워 로그아웃되셨습니다.<br>다시 로그인하시길 바랍니다')</script>`);
      res.writeHead(302,{Location : `https://nid.naver.com/oauth2.0/authorize?response_type=code&state=${state}&redirect_uri=${redirectURI}&client_id=${client_id}&oauth_os=&inapp_view=&locale=ko_KR&auth_type=reauthenticate`});
      res.end();
    }
  });
});

app.listen(3000, function () {
  console.log('http://127.0.0.1:3000/ app is listening on port 3000!');
});