const express = require('express');
const jwt = require('jsonwebtoken')
const app = express();


app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const adminSecretKey = "#KztyYup14$$"
const userSecretKey = "&kZTYyUP25**"

const generateJwtAdmin = (admin) => {
  const payload = { username: admin.username }
  return jwt.sign(payload, adminSecretKey, { expiresIn: '1h' })
}

const generateJwtUser = (user) => {
  const payload = { username: user.username }
  return jwt.sign(payload, userSecretKey, { expiresIn: '1h' })
}

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


// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const newAdmin = req.body
  if(newAdmin.username === null) {
    res.status(409).json({message: "Invalid username"})
  }
  var adminExists = ADMINS.find(admin => admin.username === newAdmin.username)
  if(adminExists) {
    res.status(409).json({message: "Admin already exists"})
  } else {
    ADMINS.push(newAdmin)
    const token = generateJwtAdmin(newAdmin)
    res.status(201).json({ message: "Admin created successfully", token: token })
  }
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  const { username, password } = req.headers
  const admin = ADMINS.find(a => a.username === username && a.password === password)
  if(admin) {
    const token = generateJwtAdmin({username: username})
    res.status(200).json({message: "Admin Login Successful", token})
  } else {
    res.status(403).json({message: "Admin Authentication failed."})
  }
});

app.post('/admin/courses', adminAuth, (req, res) => {
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

app.put('/admin/courses/:courseId', adminAuth, (req, res) => {
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

app.get('/admin/courses', adminAuth, (req, res) => {
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
    const token = generateJwtUser(newUser)
    res.status(200).json({message: "User created Successfully", token})
  }
  
});

app.post('/users/login', (req, res) => {
  // logic to log in user
  const { username, password } = req.headers
  const user = USERS.find(u => u.username === username && u.password === password)

  if(user) {
    const token = generateJwtUser(user)
    res.json({message: "Login Successful", token})
  } else {
    res.status(403).json({message: "User Authentication failed."})
  }
});

app.get('/users/courses', userAuth, (req, res) => {
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

app.get('/users/purchasedCourses', userAuth, (req, res) => {
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