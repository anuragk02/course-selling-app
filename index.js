const express = require('express')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const app = express();


app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const adminSecretKey = "#KztyYup14$$"
const userSecretKey = "&kZTYyUP25**"

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
})

const adminSchema = new mongoose.Schema({
  username: String,
  password: String
})

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  imageLink: String,
  published: Boolean
})

const User = mongoose.model('User', userSchema)
const Admin = mongoose.model('Admin', adminSchema)
const Course = mongoose.model('Course', courseSchema)


const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization
    if(authHeader) {
      const authToken = authHeader.split(' ')[1]

      jwt.verify(authToken, adminSecretKey, (err, admin) => {
        if(err) {
          return res.sendStatus(403)
        }
        req.user = admin
        next();
      })
    } else {
      res.sendStatus(401)
    }
}

const userAuth = (req, res, next) => {
  const authHeader = req.headers.authorization
  if(authHeader) {
    const authToken = authHeader.split(' ')[1]

    jwt.verify(authToken, userSecretKey, (err, user) => {
      if(err) {
        return res.sendStatus(403)
      }
      req.user = user
      next();
    })
  } else {
    res.sendStatus(401)
  }
}

mongoose.connect('mongodb+srv://anuragkhandelwal19:SZqdUVvv0KGdIQWz@cluster0.dsxs5uu.mongodb.net/course-app')

// Admin routes
app.post('/admin/signup', async (req, res) => {
  // logic to sign up admin
  const {username, password} = req.body
  if(username === null) {
    res.status(409).json({message: "Invalid username"})
  }
  const admin = await Admin.findOne({ username })
  if(admin) {
    res.status(403).json({message: "Admin already exists"})
  } else {
    const newAdmin = new Admin({ username, password })
    await newAdmin.save()
    const token = jwt.sign({username, role: 'admin'}, adminSecretKey, {expiresIn: '1h'})
    res.json({ message: "Admin created successfully", token })
  }
});

app.post('/admin/login', async (req, res) => {
  // logic to log in admin
  const { username, password } = req.headers
  const admin = await Admin.findOne({ username, password })
  if(admin) {
    const token = jwt.sign({username, role: 'admin'}, adminSecretKey, {expiresIn: '1h'})
    res.json({message: "Admin Login Successful", token})
  } else {
    res.status(403).json({message: "Admin Authentication failed."})
  }
});

app.post('/admin/courses', adminAuth, async (req, res) => {
  // logic to create a course
  const course = new Course(req.body)
  await course.save()
  res.json({message: 'Course created successfully', courseId: course.id})
});

app.put('/admin/courses/:courseId', adminAuth, async (req, res) => {
  // logic to edit a course
  const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, { new: true }) 
  if(course) {
    res.json({message: "course updated successfully"})
  } else {
    res.status(404).json({message: "course not found"})
  }
});

app.get('/admin/courses', adminAuth, async (req, res) => {
  // logic to get all courses
  const courses = await Course.find({})
  res.json({ courses })
});

// User routes
app.post('/users/signup', async (req, res) => {
  // logic to sign up user
  const { username, password } = req.body
  const user = await User.findOne({ username })
  if(user) {
    res.status(403).json({message: "User already exists"})
  } else {
    const newUser = new User({ username, password })
    await newUser.save()
    const token = jwt.sign({ username, role: 'user'}, userSecretKey, {expiresIn: '1h'})
    res.json({message: "User created Successfully", token})
  }
});

app.post('/users/login', async (req, res) => {
  // logic to log in user
  const { username, password } = req.headers
  const user = await User.findOne({ username, password })
  if(user) {
    const token = jwt.sign({username, role: 'user'}, userSecretKey, {expiresIn: '1h'})
    res.json({message: "Login Successful", token})
  } else {
    res.status(403).json({message: "Invalid username or password"})
  }
});

app.get('/users/courses', userAuth, async (req, res) => {
  // logic to list all courses
  const courses = await Course.find({ published: true })
  res.json({ courses })
});

app.post('/users/courses/:courseId', userAuth, async (req, res) => {
  // logic to purchase a course
  const course = await Course.findById(req.params.courseId)
  if(course) {
    const user = await User.findOne({ username: req.user.username })
    if(user) {
      user.purchasedCourses.push(course)
      await user.save()
      res.json({message: "Purchase Successful"})
    } else {
      res.status(403).json({message: "user not found"})
    }
  } else {
    res.status(404).json({message: "Course not found"})
  }
});

app.get('/users/purchasedCourses', userAuth, async (req, res) => {
  // logic to view purchased courses
  const user = await User.findOne({username: req.user.username}).populate('purchasedCourses')
  if(user) {
    res.json({purchasedCourses: user.purchasedCourses || [] })
  } else {
    res.status(403).json({messsage: "User not found"})
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});