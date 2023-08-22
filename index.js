const express = require('express');
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const adminAuth = (req, res, next) => {
    const { username, password } = req.headers
    const adminFound = ADMINS.find(a => a.username === username)
    if(adminFound && adminFound.password === password) {
        next()
    } else{
      res.status(401).json({message: "Admin authentication failed."})
    }
    
}

const userAuth = (req, res, next) => {
    const { username, password } = req.headers
    const userFound = USERS.find(u => u.username === username)
    if(userFound && userFound.password === password) {
      req.user = userFound
      next()
    } else {
      res.status(401).json({message: "User authentication failed."})
    }
}

// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const newAdmin = req.body
  var adminExists = ADMINS.find(admin => admin.username === newAdmin.username)
  if(adminExists) {
    res.status(409).json({message: "Admin already exists"})
  } else {
    ADMINS.push(newAdmin)
    res.status(201).json({ message: "Admin created successfully" })
  }
});

app.post('/admin/login', adminAuth, (req, res) => {
  // logic to log in admin
  res.status(200).json({message: "Admin Login Successful"})
});

app.post('/admin/courses', (req, res) => {
  // logic to create a course
  const newCourse = req.body
  var courseExists = COURSES.find(c => c.title === newCourse.title)
  if(courseExists) {
    res.status(409).json({message: "Course already exists"})
  } else {
    const courseId = Math.random()*1000000
    COURSES.push(...newCourse, {courseId: courseId})
    res.status(201).json({message: "Course created successfullly", courseId: courseId})
  }
});

app.put('/admin/courses/:courseId', (req, res) => {
  // logic to edit a course
  const updatedCourse = req.body
  var courseIndex = COURSES.findIndex(c => c.id === parseInt(req.params.courseId))
  if(courseIndex === -1) {
    res.status(404).json({message: "No such course"})
  } else {
    COURSES[courseIndex] = {...COURSES[courseIndex], ...newCourse}
    res.status(200).json({message: "Successfully updated course"})
  }
});

app.get('/admin/courses', (req, res) => {
  // logic to get all courses
  res.status(200).json({courses: COURSES})
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const newUser = {...req.body, purchasedCourses: []}
  const userExists = USERS.find(u => u.username === newUser.username)
  if(userExists) {
    res.status(409).json({message: "User already exists"})
  } else {
    USERS.push(newUser)
    res.status(200).json({message: "User created Successfully"})
  }
  
});

app.post('/users/login', userAuth,(req, res) => {
  // logic to log in user
  res.status(200).json({message: "User Login Successfull"})
});

app.get('/users/courses', (req, res) => {
  // logic to list all courses
  res.status(200).json({ courses: COURSES.filter(c => c.published) })
});

app.post('/users/courses/:courseId', userAuth, (req, res) => {
  // logic to purchase a course
  const courseId = req.params.courseId
  const course = COURSES.find(c => c.id === courseId && c.published)
  if(course) {
    req.user.purchasedCourses.push(courseId)
    res.status(200).json({message: "Course purchased successfully"})
  } else {
    res.status(404).json({message: "Course not available"})
  }
});

app.get('/users/purchasedCourses', (req, res) => {
  // logic to view purchased courses
  var purchasedCourseIds = req.user.purchasedCourses
  var purchasedCourses = []
  for(let i = 0; i < COURSES.length; ++i) {
    if(purchasedCourseIds.findIndex(COURSES[i]) !== -1) {
        purchasedCourses.push(COURSES[i])
    }
  }
  res.json({courses: purchasedCourses})
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});