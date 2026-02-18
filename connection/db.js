// import mysql from 'mysql2/promise';

// const db = await mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',         // XAMPP default
//   database: 'rettalion'   // your DB name
// });
/*
import mysql from 'mysql2/promise';

const connection  = await mysql.createConnection({
  host: 'localhost',
  user: 'apxfarms_mamta',
  password: '*yoj!v5;rq3mO}Yt',
  database: 'apxfarms_retailion'
});

// ✅ Fix: Add default export
export default connection ;
*/
import mysql from "mysql2/promise";

let connection;

export async function connectDB() {
  if (!connection) {
    try {
      connection = mysql.createPool({
        host: "localhost",
        user: "root",
        password: "root",
        port: "3306",
        database: "retailia_retailian",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
      console.log("✅ MySQL Pool created");
      // Test connection
      await connection.query("SELECT 1");
      console.log("✅ MySQL connected successfully");
    } catch (error) {
      console.error("❌ MySQL connection failed:", error.message);
    }
  }
  return connection;
}
