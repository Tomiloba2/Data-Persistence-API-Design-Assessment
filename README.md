# Profile Intelligence Service API

A RESTful backend service that aggregates data from multiple external APIs, processes and classifies it, persists it in a database, and exposes endpoints for retrieval and management.

---

##  Overview

This API is designed to:

* Integrate with multiple third-party APIs
* Process and normalize external data
* Store structured profile data in a database
* Provide clean and consistent RESTful endpoints
* Handle duplicate submissions using idempotency

---

##  Base URL

```id="b6c1ks"
https://data-persistence-api-design-assessment-production.up.railway.app
```

---

##  External APIs Used

* Genderize → https://api.genderize.io?name={name}
* Agify → https://api.agify.io?name={name}
* Nationalize → https://api.nationalize.io?name={name}

---

##  Data Processing Rules

###  Genderize

* Extract:

  * `gender`
  * `probability` → `gender_probability`
  * `count` → `sample_size`

---

###  Agify

* Extract:

  * `age`
* Compute `age_group`:

  * `0–12` → child
  * `13–19` → teenager
  * `20–59` → adult
  * `60+` → senior

---

###  Nationalize

* Extract:

  * Country list
* Select:

  * Country with highest probability
* Return:

  * `country_id`
  * `country_probability`

---

### Stored Fields

Each profile contains:

* `id` → UUID v7
* `name`
* `gender`
* `gender_probability`
* `sample_size`
* `age`
* `age_group`
* `country_id`
* `country_probability`
* `created_at` → UTC ISO 8601

---

## API Endpoints

---

###  Create Profile

**POST** `/api/profiles`

#### Request Body

```json id="u9v0cu"
{
  "name": "ella"
}
```

---

###  Success Response (201)

```json id="axv9yz"
{
  "status": "success",
  "data": {
    "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
    "name": "ella",
    "gender": "female",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 46,
    "age_group": "adult",
    "country_id": "DRC",
    "country_probability": 0.85,
    "created_at": "2026-04-01T12:00:00Z"
  }
}
```

---

###  Idempotency

If the same name is submitted again:

```json id="7y6l5u"
{
  "status": "success",
  "message": "Profile already exists",
  "data": { "...existing profile..." }
}
```

* No duplicate records are created
* Existing record is returned

---

###  Get Profile by ID

**GET** `/api/profiles/{id}`

####  Success Response (200)

```json id="mpdztk"
{
  "status": "success",
  "data": {
    "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
    "name": "emmanuel",
    "gender": "male",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 25,
    "age_group": "adult",
    "country_id": "NG",
    "country_probability": 0.85,
    "created_at": "2026-04-01T12:00:00Z"
  }
}
```

---

###  Get All Profiles (with Filters)

**GET** `/api/profiles`

#### Optional Query Parameters (case-insensitive):

* `gender`
* `country_id`
* `age_group`

#### Example:

```id="z1sjp6"
/api/profiles?gender=male&country_id=NG
```

---

###  Success Response (200)

```json id="gq6kwh"
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "id": "id-1",
      "name": "emmanuel",
      "gender": "male",
      "age": 25,
      "age_group": "adult",
      "country_id": "NG"
    },
    {
      "id": "id-2",
      "name": "sarah",
      "gender": "female",
      "age": 28,
      "age_group": "adult",
      "country_id": "US"
    }
  ]
}
```

---

###  Delete Profile

**DELETE** `/api/profiles/{id}`

#### Success Response

* `204 No Content`

---

##  Error Handling

All errors follow this format:

```json id="n7m5n0"
{
  "status": "error",
  "message": "<error message>"
}
```

---

###  Error Types

| Status Code | Condition               |
| ----------- | ----------------------- |
| 400         | Missing or empty `name` |
| 422         | Invalid input type      |
| 404         | Profile not found       |
| 500         | Internal server error   |
| 502         | External API failure    |

---

##  External API Edge Cases

Return `502` and DO NOT store data if:

* Genderize:

  * `gender: null`
  * `count: 0`

* Agify:

  * `age: null`

* Nationalize:

  * No country data

---

### Example:

```json id="s0cxr9"
{
  "status": "error",
  "message": "Genderize returned an invalid response"
}
```

---

##  CORS Configuration

```id="d4vjlwm"
Access-Control-Allow-Origin: *
```

---

## Tech Stack


* Backend: Typescript/Node.js/Express
* Database: PostgreSQL
* ORM: Prisma
* HTTP Client: fetch
* UUID v7 library

---

### cURL Example

```bash id="f9xxeh"
curl -X POST https://your-api-domain.com/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"name": "ella"}'
```

---

##  Installation (Optional)

```bash id="0sbf2o"
git clone https://github.com/Tomiloba2/Data-Persistence-API-Design-Assessment.git
cd your-repo
npm install
npm run start
```

---


##  Author

Tomiloba
GitHub: https://github.com/tomiloba2

---
