const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");


//checking if order exists
function exists(req, res, next) {
    //grabbing order id from params
    const { orderId } = req.params;
    //locating order
    const foundOrder = orders.find(order => order.id === orderId);
    
    if(!foundOrder) {
        //if order was not located we send 404 status and error message
        return next({
            status: 404,
            message: `Dish not found ${orderId}`,
        });
    };
    //if it is located we set the locals.order to the foundOrder
    res.locals.order = foundOrder;
    next();
}

//checking order for valid properties
function validateOrder(req, res, next) {
    //destructuring the order
    const { data: { dishes } = {} } = req.body;
    
    //validate properties
    const requiredFields = ["deliverTo", "mobileNumber", "dishes"];
    for (const field of requiredFields) {
        if (!req.body.data[field]) {
            next({ status: 400, message: `A '${field}' property is required.` });
        }
    }
    
    //validate dishes
    if (!Array.isArray(dishes)) {
      return res.status(400).json({ error: "dishes must be an array" });
    }
    if (dishes.length < 1) {
      return res.status(400).json({ error: "dishes must be greater than one" });
    }
    
    //check quantity
    for (const index in dishes) {
        if (typeof dishes[index].quantity !== "number") {
          return res.status(400).json({
            error: `Dish ${index} must have a quantity that is an integer greater than 0`,
          });
        }
        if (dishes[index].quantity < 1) {
          return res.status(400).json({
            error: `Dish ${index} must have a quantity that is an integer greater than 0`,
          });
        }
    }
    
    next();
}

// checking new order for valid properties before update
function validateUpdate(req, res, next) {
    //getting order id from params
    const { orderId } = req.params;
    //creating expected order status list
    const orderStatus = ['pending', 'preparing', 'out-for-delivery', 'delivered'];
    //getting the new order information
    let newOrder = req.body.data;
    //checking if there is a valid status in the new order
    if(!newOrder.status || !orderStatus.includes(newOrder.status)) {
        //if not throw errror
        return next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, or delivered`,
        });
    };
    //if no id in the new order, set id to the order id from params
    if(!newOrder.id) newOrder.id = orderId;
    //if the new orders id does not equal the id from params, 
    if(newOrder.id != orderId) {
        //throw error
        return next({
            status: 400,
            message: `Order id ${newOrder.id} does not match the route link!`
        });
    };
    next();
}

//lists all orders
function list (req, res, next) {
    res.json({ data: orders });
}

//creates new order
function create(req, res, next) {
    let newOrder = req.body.data;
    newOrder.id = nextId();
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

//returns a specific order
function read(req, res, next) {
    const { orderId } = req.params;
    res.json({ data: res.locals.order });
}

//updates an existing order
function update(req, res, next) {
    const { orderId } = req.params;
    let newOrder = req.body.data;
    if(!newOrder.id) newOrder.id = orderId;
    res.json({ data: newOrder });
}

//removes/deletes an existing order, but only if it is still pending
function remove(req, res, next) {
    if(res.locals.order.status !== 'pending') {
        return next({
            status: 400,
            message: `Only a pending order can be removed!`,
        });
    };
    const index = orders.indexOf(res.locals.order);
    orders.splice(index, 1);
    res.sendStatus(204).json({ data: res.locals.order });
}

module.exports = {
    read: [exists, read],
    update: [exists, validateOrder, validateUpdate, update],
    list,
    create: [validateOrder, create],
    delete: [exists, remove]
}