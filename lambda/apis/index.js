'use strict';
const dynamodb = require('../common/Dynamo');
const uuid = require('uuid');
function getCountUserId(lillyId){
  return new Promise( async (resolve,reject)=>{
   
try {
  
    var params = {
    TableName : process.env.WOOVLY_TABLE,
    IndexName: 'user-index',
    KeyConditionExpression: `lillyUserId = :hkey`,
            ExpressionAttributeValues: {
                ':hkey': lillyId,
            }


   
};

var result= [];
   result = await dynamodb.query(params).promise();
   // map items on active_flag
   resolve(result.Count);
  console.log(JSON.stringify(result))
} catch (error) {
  console.error(error);
}


  })

}
function getUserInfo(lillyId){
return new Promise( async (resolve,reject)=>{
try {
    var params = {
    TableName : process.env.WOOVLY_TABLE,
    IndexName: 'user-index',
    KeyConditionExpression: `lillyUserId = :hkey`,
            ExpressionAttributeValues: {
                ':hkey': lillyId,
            }
};
var result= [];
   result = await dynamodb.query(params).promise();
   // map items on active_flag
   resolve(result);

 
} catch (error) {
  console.error(error);
}


  })

}

function getUserVersionInfoData(lillyId,versionId){
  return new Promise( async (resolve,reject)=>{
   
try {

  var params = {
    TableName : process.env.WOOVLY_TABLE,
    IndexName: 'user-version-index',
    KeyConditionExpression: "lillyUserId = :a and versionId = :t",
    ExpressionAttributeValues: {
        ":a": lillyId,
        ":t": versionId
    }
  
   
};



var result= [];
   result = await dynamodb.query(params).promise();
   // map items on active_flag
   resolve(result);

 
} catch (error) {
  console.error(error);
}


  })

}

module.exports.create = async (event, context, callback) => {
  const timestamp = new Date().getTime();
  const bodyObj = JSON.parse(event.body);
  const params = {
    TableName: process.env.WOOVLY_TABLE,
    Item: {
      ID: uuid.v1(),
      lillyUserId:bodyObj.lillyId,
      userName:bodyObj.name ,
      info:bodyObj.info ,
      version:0,
      createdAt: timestamp,
      updatedAt: timestamp,
      active_flag:1,
      applicationName:bodyObj.applicationName
    },
  };

  let count =0;
  try{
   count = await getCountUserId(bodyObj.lillyId);
  }catch(err){

  }
   
  params.Item.versionId =count.toString(); 

  dynamodb.put(params, (error) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Error while creating',
      });
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: 'Created succesfullly',
    };
    callback(null, response);
  });




};


module.exports.listUserVersion = async (event, context, callback) => {
const lillyId = event.pathParameters.lillyId;
console.log(lillyId)
const response = {};
if(!lillyId){
  callback(null, {
    statusCode: error.statusCode || 501,
    headers: { 'Content-Type': 'text/plain' },
    body: 'Missing Params',
  });

}
let data = '';
try{

data = await getUserInfo(lillyId);
console.log(data)
let versions = data.Items.filter((itemObj)=>{
    return itemObj.versionId;
}).map((obj)=>{
  return obj.versionId
});
let responseObj = {versions:versions}
callback(null, {
  statusCode: 200,
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify(responseObj),
});

}catch(err){
  console.log(err);

}
 



}



module.exports.getUserInfo = async (event, context, callback) => {
  const versionId = event.pathParameters.versionId;
  const lillyId = event.pathParameters.lillyId;
  try{
    let data ='';
if(versionId){
   data = await getUserVersionInfoData(lillyId,versionId);
}else{
  data = await getUserInfo(lillyId);
  let obj ='';
  let max = 0;
   data.Items.map((item)=>{
     if(item.active_flag == 1){
      if(item.versionId > max){
        obj=item;
        max= item.versionId ;

      }
     }
    
  });
  callback(null, {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(obj),
  });
}
  callback(null, {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(data.Items),
  });
  }catch(err){
    console.log(err)
    callback(null, {
      statusCode: err.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Error while fetching',
    });
  }

 

}













function updateUserInfoDetails(info,ID){
  return new Promise((resolve,reject)=>{
var params = {
  TableName:process.env.WOOVLY_TABLE,
  Key:{
    'ID': ID
  },
  UpdateExpression: "set info = :r",
  ExpressionAttributeValues:{
      ":r":info
      
  },
  ReturnValues:"UPDATED_NEW"
};
     console.log("Updating the item...");
    dynamodb.update(params, function(err, data) {
    if (err) {
        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    }
    resolve(data)
});

})
}





module.exports.updateUserInfo = async (event, context, callback) => {
  console.log(event.body)
  const {info} = JSON.parse(event.body);
  console.log(info)
  let ID = event.pathParameters.ID;


  try{
  let data = await updateUserInfoDetails(info,ID);
  callback(null, {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(data),
  });
  }catch(err){
    console.log(err)
    callback(null, {
      statusCode: err.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Error while fetching',
    });
  }

 

}


