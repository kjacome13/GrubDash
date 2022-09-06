const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

//checking if the dish exists
function exists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if(!foundDish){
        return next({
            status: 404,
            message: `Dish not found ${dishId}`,
        });
    };
    res.locals.dish = foundDish;
    next();
}

//checking if all properties are valid
function validateDish(req, res, next) {
    //destructuring
    const { data: { price } = {} } = req.body;
    //lising out valid fields
    const requiredFields = ["name", "description", "price", "image_url"];
    
    //checking if dish has all required fields
    for (const field of requiredFields) {
      if (!req.body.data[field]) {
        next({ status: 400, message: `A '${field}' property is required.` });
      }
    }
    //checking if price is a number and greater than 0
    if (typeof price !== "number" || price < 1) {
        return res.status(400).json({ error: "price must be a number" });
      }
    if (price < 0) {
        return res
          .status(400)
          .json({ error: "price must be a number greater than zero" });
    }
    next();
}

//checking if new dish has all required properties
function validateUpdate(req, res, next) {
    //getting id from params
    const { dishId } = req.params;
    //getting the newDish
    const newDish = req.body.data;
    //if there is no id, set the id to the one from params
    if(!newDish.id) newDish.id = dishId;
    //if the newdish id and the one from params do not match, throw error
    if(newDish.id != dishId){
        return next({
            status: 400,
            message: `Dish id ${newDish.id} does not match the route link!`,
        });        
    }
    next();
}

//returns a specific dish
function read(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    res.json({ data: foundDish });
}

//updates and existing dish
function update(req, res, next) {
    const newDish = req.body.data;
    for(let dish of dishes){
        if(dish.id == newDish.id){
            Object.assign(dish, newDish);
        };
    };
    res.json({ data: newDish });
}

//lists out all existing dishes
function list(req, res, next) {
    res.json({ data: dishes });
}

//creates a new dish
function create(req, res, next) {
    let newDish = req.body.data;
    newDish.id = nextId();
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

module.exports = {
    read: [exists, read],
    update: [exists, validateDish, validateUpdate, update],
    list,
    create: [validateDish, create],
}