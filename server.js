// imports 
import express from 'express'
import bodyParser from 'body-parser'
import pg from 'pg'

// Global variables
const app = express();
const port = 3000;
var error_occured1;
var error_occured2;
var todos = [];
let one_todo= [];
var wrotes = [];
var fetched = []
// Assuming users just for now after that ill set up things for it just for now only i am the user

var first_name = 'Rational'    // spaces and spelling mistakes are giving errors 
var second_name = 'Dreams'

// middlewares 

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));


// Database connection 
const db= new pg.Client({
    user : "postgres",
    database : "planorama",
    host: "localhost",
    password:"cat hissed 33",
    port:"5432"
})
db.connect();


// Gets todays date in this format : SAT,01-03-2025
const formatDate = () => {
    const today = new Date();

    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const day = days[today.getDay()];

    const date = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();

    return `${day},${date}-${month}-${year}`;
};

// gets user id 
async function dbUserId(first, second){
    const results = await db.query("SELECT * FROM users WHERE first_name ILIKE '%'||$1||'%' AND second_name ILIKE '%'||$2||'%'",
        [first, second]);
    return Number(results.rows[0].id) 
}
// get todays todos 
async function dbtodos(date, user){
    const results = await db.query("SELECT * FROM todos WHERE date = $1 AND user_id = $2",
        [date, user]);
    return results.rows 
}
// get if user wrote today or not
async function ifWrote(date, user){
    const results = await db.query("SELECT * FROM wrote WHERE date = $1 AND user_id = $2",
        [date, user]);
    return results.rows 
}
// get wrotes of a user


async function getWrotes(user){
    const results = await db.query("SELECT * FROM wrote WHERE user_id = $1",
        [user]);
    return results.rows 
}

// TO INSERT todos into the todos table
async function insertTodos(date, todo_insert , user){
         await db.query("INSERT INTO todos (date, todos, user_id) VALUES ($1, $2, $3)",
        [date, todo_insert, user]);
}
// TO INSERT if someone has made a todo list today
async function insertWrote(date, user){
         await db.query("INSERT INTO wrote (user_id, date) VALUES ($1, $2)",
        [user, date]);
}

// TO DELETE a todo list from the todos table
async function deletionInDb(todo_id) {
    await db.query("DELETE FROM todos WHERE id = $1",
        [todo_id]);
}
// TO Update a todo list from the todos table
async function updateInDb(the_text, thatonetodo_id) {
    await db.query("UPDATE todos SET todos = $1 WHERE id = $2",
        [the_text,thatonetodo_id]);
}
// find one todo
async function oneTodoInDb(oneTodoId) {
  const result =await db.query("SELECT * FROM todos WHERE id = $1",
        [oneTodoId]);
        return result.rows
}


// main page "/" endpoint

app.get("/",  async(req, res)=>{
    const userID = await dbUserId(first_name, second_name);
    try {
    todos =  await dbtodos(formatDate(), userID)
    wrotes = await getWrotes(userID)
    } catch (error) {
        console.log(`trycatch error : ${error.message}`)
    }

    res.render("index.ejs",{
        todos_list: todos,
        today: formatDate(),
        user_wrotes: wrotes
    } )
})


// add one goes here 
app.get("/add_one",  async(req, res)=>{
    const userID = await dbUserId(first_name, second_name);
    try {
    wrotes = await getWrotes(userID)
    } catch (error) {
        console.log(`trycatch error : ${error.message}`)
    }

    res.render("add_one.ejs",{
        today: formatDate(),
        user_wrotes: wrotes
    })
})

// create's post request is handled here

app.post("/create", async (req, res)=> {
    const typed = req.body.todo; 
    const userID = await dbUserId(first_name, second_name);
     try {
         insertTodos(formatDate(), typed, userID);
         error_occured1 = false
        
        } catch (error) {
        console.error("An error occurred:", error.message);
        error_occured1 = true
    }
    try {
        const results = await ifWrote(formatDate(), userID)
        if(results && results.length != 0){
            error_occured2 = true
        }
    } catch (error) {
        console.error("An error occurred:", error.message);
        error_occured1 = false
    }
    if(!error_occured1 && !error_occured2){
   insertWrote(formatDate(), userID)
}
     res.redirect("/")
})

// for deleting page goes here

app.get("/Delete", async (req, res)=>{
    const userID = await dbUserId(first_name, second_name);
    try {
    todos =  await dbtodos(formatDate(), userID)
    wrotes = await getWrotes(userID)

    } catch (error) {
        console.log(`trycatch error : ${error.message}`)
    }
    res.render("Delete.ejs",{
        todos_list: todos,
        today: formatDate(),
        user_wrotes: wrotes
    } )
})

// delete post request is handled here
app.post("/delete_one/:id", async (req, res)=> {
 const todoId =  req.params.id;
     try {
        await deletionInDb(todoId)
        
        } catch (error) {
        console.error("An error occurred:", error.message);
    }
res.redirect("/Delete")
})
// edit page is handled here
app.get("/Edit/:id", async(req, res)=>{
const id = req.params.id;
const userID = await dbUserId(first_name, second_name);
  try {
    one_todo = await oneTodoInDb(id)
    wrotes = await getWrotes(userID)
  } catch (error) {
    console.log(`the error got is: ${error.message}`)
  }
  res.render("Edit.ejs", {
    todo_to_edit : one_todo,
    today: formatDate(),
    user_wrotes: wrotes
  })
})

// editing thing goes here
app.post("/editing/:id", async(req, res)=>{
    const id = req.params.id;
    const typed = req.body.todo; 
  try {
       await updateInDb(typed, id)
  } catch (error) {
    console.log(`the error got is: ${error.message}`)
  }
  res.redirect("/")
})

// fetch records here
app.get("/records/:id", async(req,res)=>{
    const mentioned_date = req.params.id;
    const userID = await dbUserId(first_name, second_name);
    try {
        fetched = await dbtodos(mentioned_date, userID)
        wrotes = await getWrotes(userID)
    } catch (error) {
        console.log(`the error got is: ${error.message}`)
    }

    res.render("fetched.ejs", {
        todos_list: fetched,
        today: mentioned_date,
        user_wrotes: wrotes
    })
})

// connectivity response 
app.listen(port, ()=> {
    console.log(`Successfully hosted!, port: ${port} `)
})