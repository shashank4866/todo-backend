const http = require('http');
const { Client } = require("pg");

const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "todo",
  password: "admin",
  port: 5432
});

client.connect();

http.createServer(async (req, res) => {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // GET TASKS
  if (req.url === '/tasks' && req.method === 'GET') {

    let results = await client.query('SELECT * FROM todolist');

    res.writeHead(200, { "Content-Type": "application/json" });

    res.end(JSON.stringify({
      status: 200,
      message: "success",
      data: results.rows
    }));
  }

  // ADD TASK
  else if (req.url === '/addtask' && req.method === 'POST') {

    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", async () => {

      let data = JSON.parse(body);

      let result = await client.query(
        'INSERT INTO todolist (tname, tstatus) VALUES ($1,$2) RETURNING *',
        [data.tname, data.tstatus]
      );

      res.writeHead(201, { "Content-Type": "application/json" });

      res.end(JSON.stringify({
        status: 201,
        message: "Task added",
        data: result.rows[0]
      }));
    });
  }

  // DELETE TASK
  else if (req.method === 'DELETE' && req.url.startsWith('/deletetask/')) {

    let id = req.url.split('/')[2];

    await client.query('DELETE FROM todolist WHERE id=$1', [id]);

    res.end(JSON.stringify({
      status: 200,
      message: 'Task deleted'
    }));
  }

  // UPDATE TASK
  else if (req.method === "PUT" && req.url.startsWith("/updatetask/")) {

    const id = req.url.split("/")[2];

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {

      const data = JSON.parse(body);

      const result = await client.query(
        "UPDATE todolist SET tname=$1, tstatus=$2 WHERE id=$3 RETURNING *",
        [data.tname, data.tstatus, id]
      );

      res.end(JSON.stringify(result.rows[0]));
    });
  }

}).listen(3000, () => {
  console.log("Server running on port 3000");
});