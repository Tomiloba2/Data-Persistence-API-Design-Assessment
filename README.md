# Profile Aggregation API

A RESTful API that aggregates user profile data from multiple external services, applies business logic, and persists the result in a database.

---

## Overview

This API exposes a single **POST endpoint** that:

* Accepts a `name`
* Calls three external APIs:

  * Genderize
  * Agify
  * Nationalize
* Processes and classifies the data
* Stores the result in a database
* Ensures **idempotency** (no duplicate records for the same name)

---

##  Base URL

```
https://your-api-domain.com
```

---

##  Endpoint

### Create Profile

**POST** `/api/profiles`

---

##  Request Body

```json
{
  "name": "ella"
}
```

---

##  Success Response (200 OK)

```json
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

##  Idempotency Behavior

If the same name is submitted more than once:

```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": {
    "...existing record..."
  }
}
```

* No duplicate records are created
* Existing record is returned

---

##  Data Processing Rules

### 1. Genderize API

* Extract:

  * `gender`
  * `probability` → `gender_probability`
  * `count` → `sample_size`

---

### 2. Agify API

* Extract:

  * `age`
* Classify `age_group`:

  * `0–12` → child
  * `13–19` → teenager
  * `20–59` → adult
  * `60+` → senior

---

### 3. Nationalize API

* Extract:

  * Country list
* Select:

  * Country with **highest probability**
* Return:

  * `country_id`
  * `country_probability`

---

##  Data Persistence

Each processed profile is stored with:

* `id` → UUID v7
* `created_at` → UTC timestamp (ISO 8601)

---

##  Error Handling

All errors follow this structure:

```json
{
  "status": "error",
  "message": "<error message>"
}
```

---

##  Error Cases

| Status Code | Condition                        |
| ----------- | -------------------------------- |
| 400         | Missing or empty `name`          |
| 422         | `name` is not a string           |
| 404         | No valid data from external APIs |
| 500 / 502   | External API or server failure   |

---

##  Edge Cases

Data is not stored if any of the following occurs:

* Genderize:

  * `gender: null`
  * `count: 0`

* Agify:

  * `age: null`

* Nationalize:

  * No country data returned

Response:

```json
{
  "status": "error",
  "message": "No valid prediction available for the provided name"
}
```

---

##  CORS Configuration

The API includes:

```
Access-Control-Allow-Origin: *
```

---

## 🛠️ Tech Stack


*  Typescript/Node.js /Express
* HTTP client (fetch)
* Database (PostgreSQL)
* UUID v7 generation library

---

## Testing

### cURL Example

```bash
curl -X POST https://your-api-domain.com/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"name": "ella"}'
```

---

## Installation (Optional)

```bash
git clone https://github.com/Tomiloba2/Data-Persistence-API-Design-Assessment.git
cd your-repo
npm install
npm run start
```

---

## Author

Tomiloba
GitHub: https://github.com/tomiloba2

---
