const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'covid19IndiaPortal.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()
const zinOne = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const hashPassword = await bcrypt.hash(password, 10)
  const selectUserName = `
  SELECT * 
  FROM user 
  WHERE username = '${username}' `
  const dbUser = await db.get(selectUserName)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      }
      const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

function authenticationToken(request, response, next) {
  const authHeader = request.headers['authorization']
  let jwtToken
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        next()
      }
    })
  }
}

app.get('/states/', authenticationToken, async (request, response) => {
  const {state_id, state_name, population} = request.body

  const selectStates = `
  SELECT * 
  FROM state 
   `
  const dbUserTwo = await db.all(selectStates)
  response.send(dbUserTwo.map(i => zinOne(i)))
})

module.exports = app

app.get('/states/:stateId/', authenticationToken, async (request, response) => {
  const {stateId} = request.params
  const {state_id, state_name, population} = request.body
  const selectStatesOne = `
  SELECT  * 
  FROM state 
  WHERE state_id = ${stateId}`
  const dbUserThree = await db.get(selectStatesOne)
  response.send(zinOne(dbUserThree))
})
const zinTwo = dbObjectTwo => {
  return {
    districtName: dbObjectTwo.district_name,
    stateId: dbObjectTwo.state_id,
    cases: dbObjectTwo.cases,
    cured: dbObjectTwo.cured,
    active: dbObjectTwo.active,
    deaths: dbObjectTwo.deaths,
  }
}

app.post('/districts/', authenticationToken, async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const adding = `
  INSERT INTO district (districtName, stateId, cases, cured, active, deaths)
  VALUES (
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  )`
  const dbFour = await db.run(adding)
  const tron = zinTwo(dbFour)
  response.send('District Successfully Added')
})

const zinThree = dbObjectThree => {
  return {
    districtId: dbObjectThree.district_id,
    districtName: dbObjectThree.district_name,
    stateId: dbObjectThree.state_id,
    cases: dbObjectThree.cases,
    cured: dbObjectThree.cured,
    active: dbObjectThree.active,
    deaths: dbObjectThree.deaths,
  }
}
app.get(
  '/districts/:districtId/',
  authenticationToken,
  async (request, response) => {
    const {districtId} = request.params
    const selectDIstrictsFive = `
  SELECT * 
  FROM district 
  WHERE district_id = ${districtId}`
    const getDistricts = await db.get(selectDIstrictsFive)
    response.send(zinThree(getDistricts))
  },
)

const finalOne = dbObjectFive => {
  return {
    totalCases: dbObjectFive.totalCases,
    totalCured: dbObjectFive.totalCured,
    totalActive: dbObjectFive.totalActive,
    totalDeaths: dbObjectFive.totalDeaths,
  }
}

app.get(
  '/states/:stateId/stats/',
  authenticationToken,
  async (request, response) => {
    const {stateId} = request.params
    const gettingState = `SELECT 
  SUM(cases) AS totalCases,
  SUM(cured) AS totalCured,
  SUM(active) AS totalActive,
  SUM(deaths) AS totalDeaths 
  FROM district 
  WHERE state_id = ${stateId}`

    const gettingStateStats = await db.get(gettingState)
    response.send({
      totalCases: gettingStateStats.totalCases,
      totalCured: gettingStateStats.totalCured,
      totalActive: gettingStateStats.totalActive,
      totalDeaths: gettingStateStats.totalDeaths,
    })
  },
)

app.put(
  '/districts/:districtId/',
  authenticationToken,
  async (request, response) => {
    const {districtId} = request.params
    const {districtName, stateId, cases, cured, active, deaths} = request.body
    const api6 = `
  UPDATE district 
  SET  district_name = '${districtName}',
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  `
    await db.run(api6)
    response.send('District Details Updated')
  },
)

app.delete(
  '/districts/:districtId/',
  authenticationToken,
  async (request, response) => {
    const {districtId} = request.params
    const deleteOne = `
  DELETE FROM 
  district 
  WHERE district_id = ${districtId}`
    await db.run(deleteOne)
    response.send('District Removed')
  },
)
