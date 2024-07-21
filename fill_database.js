// Using import statements instead of require
import { config } from 'dotenv';
// Import the entire pg module as a single object
import pkg from 'pg';
import fs from "fs"
import vec_data from "./vec_data.json" assert {type:"json"}
import charger_data from "./charger_data.json" assert {type:"json"}
config();

const { Client } = pkg;

// Create a client instance with your database configuration
const client = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync('./assets/ca.pem').toString(), // Path to Aiven CA certificate
    }
});

client.connect(function (err) {
  if (err)
      throw err;
//   client.query("SELECT VERSION()", [], function (err, result) {
//       if (err)
//           throw err;

//       console.log(result.rows[0].version);
//       client.end(function (err) {
//           if (err)
//               throw err;
//       });
//   });
});

// const response = await client.query("SELECT * from vehicles")

// let vec_data_array = []

// vec_data.vehicle_numbers.forEach((vec, index) => {
//     vec_data_array.push([vec, vec_data.isVOR[index], false])
// })

// console.log(vec_data_array);

// const {rows:VOR_vehicles} = await client.query("SELECT id, vec_num FROM vehicles WHERE isVOR = $1", [true])
// console.log(VOR_vehicles);

// console.log(vec_data.VOR_reason[46088][0].reason);

// for (const vec of VOR_vehicles) {
//     const vec_id = vec.id
//     console.log(vec_id);
//     try{
//         const {rows} = await client.query("INSERT INTO vehicle_VOR_reason (vec_id, date_reported, VOR_reason) VALUES($1, $2, $3) RETURNING *", [vec_id, vec_data.VOR_reason[vec.vec_num][0].date, vec_data.VOR_reason[vec.vec_num][0].reason])
//         console.log(rows);
//     } catch(err){
//         console.error(err);
//     }

// }
/* INSERTING VEHICLES INTO DATABASE */
/* forEach has issues with async functions */
// vec_data_array.forEach(async(vec) => {
//     const {data} = await client.query("INSERT INTO vehicles (vec_num, isVOR, driven) VALUES($1, $2, $3)", vec)
//     console.log(data);
// })

/* INSERTING CHARGERS INTO THE DATABASE */

/* Formatting the data to be inserted */

// let charger_db_data = []
let charger_vor_reason_db_data = []
// for(let i = 0; i < charger_data.charger_name.length; i++){
//     charger_db_data.push([charger_data.charger_name[i], charger_data.location[i], charger_data.isVOR[i], charger_data.type[i]])
// }
// console.log(charger_db_data)

const {rows} = await client.query("SELECT id, charger_num FROM chargers WHERE isvor=$1", [true])
console.log(rows);

for(const charger of rows){
    const charger_num = charger.charger_num
    const charger_id = charger.id
    const vor_reasons = charger_data.VOR_reason[charger_num]
    for(const reason of vor_reasons){
        charger_vor_reason_db_data.push([charger_id, reason.date, reason.reason])
    }
}
console.log(charger_vor_reason_db_data);

console.log("INSERTING INTO DB");

for(const vor_reason_db of charger_vor_reason_db_data){
    const {rows} = await client.query("INSERT INTO charger_vor_reason (charger_id, date_reported, vor_reason) VALUES($1, $2, $3) RETURNING *", vor_reason_db);
    console.log(rows);
}

// 1. Insert into chargers database first


// for(const data of charger_db_data){
//     try{
//         const response = await client.query("INSERT INTO chargers (charger_num, charger_loc, isvor, type) VALUES ($1, $2, $3, $4) RETURNING *", data)
//       console.log(response);
//     }catch(err){
//         console.error(err);
//     }
    
// }