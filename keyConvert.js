const fs =require('fs');
const key = fs.readFileSync('./assignment-for-auth-41899-firebase-adminsdk-fbsvc-17a691160a.json','utf8')
const base64 = Buffer.from(key).toString('base64')
console.log(base64)