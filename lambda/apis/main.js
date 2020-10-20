const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks, hooksWithValidation } = require("../common/hooks");
const yup = require("yup");
const uuid = require("uuid");
const { DynamoDB } = require("aws-sdk");
const tableName = process.env.WOOVLY_TABLE;

function getUserInfo(lillyId) {
  return new Promise(async (resolve, reject) => {
    try {
      let params = {
        tableName: process.env.WOOVLY_TABLE,
        index: "user-index",
        queryKey: "lillyUserId",
        queryValue: lillyId,
      };
      const userInfoinfo = await Dynamo.query(params);
      console.log(userInfoinfo);
      resolve(userInfoinfo);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}


function updateUserInfoDetails(info,ID){
return new Promise(async (resolve,reject)=>{
  let params= { tableName:process.env.WOOVLY_TABLE, primaryKey:'ID', primaryKeyValue:ID, updateKey:'info', updateValue:info }
    try{
     let data = await Dynamo.update(params);
     resolve(data);
    }catch(err){
        console.log(err)
        reject(err);
    }
 })
  }
  
  
  

function getUserVersionInfoData(lillyId,versionId){
    return new Promise( async (resolve,reject)=>{
     
  try {
  
    let KeyConditionExpression  = "lillyUserId = :a and versionId = :t";
    let ExpressionAttributeValues =  {
    ":a": lillyId,
    ":t": versionId
    }
    let params = {
        tableName: process.env.WOOVLY_TABLE,
        index: "user-version-index",
        KeyConditionExpression: KeyConditionExpression,
        ExpressionAttributeValues: ExpressionAttributeValues
      };

    let result=    await  Dynamo.queryMultipleIndex(params)
    resolve(result);
  
   
  } catch (error) {
    console.error(error);
  }
  
  
    })
  
  }

  
const create = async (event, context, callback) => {
  const bodySchemaCreate = yup.object().shape({
    lillyId: yup.string().required(),
    name: yup.string().required(),
    info: yup.string().required(),
    applicationName: yup.string().required(),
  });

  const timestamp = new Date().getTime();
  const bodyObj = JSON.parse(event.body);
  const isvalid = await bodySchemaCreate.isValid(bodyObj);
  /*{"name":"akash212",
        "info":"te33st",
        "lillyId":"C297295",
        "applicationName":"DHAI"
        }*/
  if (!isvalid) {
    return Responses._400({ message: "Invalid" });
  }

  const params = {
    ID: uuid.v1(),
    lillyUserId: bodyObj.lillyId,
    userName: bodyObj.name,
    info: bodyObj.info,
    version: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    active_flag: 1,
    applicationName: bodyObj.applicationName,
  };

  let count = 0;
  try {
    let userInfo = await getUserInfo(bodyObj.lillyId);
    count = userInfo.length;
  } catch (err) {
    console.log(err);
  }
  console.log(count);
  params.versionId = count.toString();
  const insertData = await Dynamo.write(params, process.env.WOOVLY_TABLE);

  if (!insertData) {
    return Responses._400({ message: "Failed to write" });
  }

  return Responses._200({ insertData });
};

const listUserVersion = async (event, context, callback) => {
  const lillyId = event.pathParameters.lillyId;
  const pathSchema = yup.object().shape({
    ID: yup.string().required(),
  });
  if (!event.pathParameters || !event.pathParameters.lillyId) {
    return Responses._400({ message: "missing path params" });
  }
  let data = "";
  try {
    data = await getUserInfo(lillyId);
    let versions = data
      .filter((itemObj) => {
        return itemObj.active_flag == 1;
      })
      .map((obj) => {
        return obj.versionId;
      });
    return Responses._200({ versions: versions });
  } catch (err) {
    console.log(err);
    return Responses._400({ message: "Failed to fetch" });
  }
};
const getUserInfoDetails =  async (event, context, callback) => {

    const versionId = event.pathParameters.versionId;
    const lillyId = event.pathParameters.lillyId;
    if (!event.pathParameters|| !event.pathParameters.lillyId) {
        return Responses._400({ message: "missing path params" });
      }
  try{
    let data ='';
if(versionId){
   data = await getUserVersionInfoData(lillyId,versionId);
}else{
  data = await getUserInfo(lillyId);
}
  let obj ='';
  let max = 0;
   data.map((item)=>{
     if(item.active_flag == 1){
      if(item.versionId > max){
        obj=item;
        max= item.versionId ;

      }
     }
    
  })
    return Responses._200(obj);
}catch(err){

    console.log(err);
    return Responses._400({ message: "Failed to fetch" });
   
  }

 
}
const updateUserInfo =  async (event, context, callback) => {
     event.body =JSON.parse(event.body);
     //  avoiding it as of now with application name to make it generic every query should be adjusted with application name
     const bodySchemaCreate = yup.object().shape({
        info: yup.string().required()
      });
    
    const isvalid = await bodySchemaCreate.isValid(event.body);
    if (!isvalid) {
        return Responses._400({ message: "Invalid" });
      }
    const {info} = event.body;
     let ID = event.pathParameters.ID;
     if(!info || !ID){
        return Responses._400({ message: "missing path params" });
     }


  try{
  let data = await updateUserInfoDetails(info,ID);
  return Responses._200(data);
  }catch(err){
    return Responses._400({ message: "Failed to update" });
  }

 


};
module.exports = { create, listUserVersion, getUserInfoDetails,updateUserInfo };
