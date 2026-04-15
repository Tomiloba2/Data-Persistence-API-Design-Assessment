
import "dotenv/config"
import express, { Application, NextFunction, Request, Response } from "express"
import cors from "cors"
import { classifyAge, validateAgify, validateGenderize, validateNationalize } from "./src/utils.js";
import prisma from "./src/prisma.js";
import { v7 as uuidv7 } from "uuid"


const app: Application = express()

app.use(cors({
    origin: "*"
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/", (req, res, next) => {
    try {
        return res.status(200).json({ message: "welcome to stage two" })
    } catch (error) {
        console.log(error);
        next(error)
    }
})

app.post("/api/profiles", async (req, res, next) => {
    try {
        const { name }: {
            name: string
        } = req.body

        //error handling

        if (!name || name === null) {
            const err = new Error("Bad Request") as any;
            err.statusCode = 400
            return next(err)
        } else if (typeof name !== "string" || !/^[A-Za-z\s]+$/.test(name)) {
            const err = new Error("Unprocessable Entity") as any;
            err.statusCode = 422
            return next(err)
        }

        //checking if name exist
        const isExist = await prisma.user.findUnique({ where: { name } })
        if (isExist) {
            return res.status(200).json({
                "status": "success",
                "message": "Profile already exists",
                "data": isExist
            })
        }

        //fetching apis
        const fetchGenderize = (): Promise<TGenderize> => fetch(`https://api.genderize.io/?name=${name}`).then(res => res.json())
        const fetchAgify = (): Promise<TAgify> => fetch(`https://api.agify.io/?name=${name}`).then(res => res.json())
        const fetchNationalize = (): Promise<TNationalize> => fetch(`https://api.nationalize.io/?name=${name}`).then(res => res.json())

        const [genderize, agify, nationalize] = await Promise.all([
            fetchGenderize(),
            fetchAgify(),
            fetchNationalize()
        ])


        //reponse validation
        const { gender, probability: gender_probability, count: sample_size } = validateGenderize(genderize,next)
        const { age } = validateAgify(agify,next)
        const { country } = validateNationalize(nationalize,next)

        const age_group = classifyAge(age)
        const { country_id, probability: country_probability } = country.reduce((prev, current) =>
            (current.probability > prev.probability) ? current : prev
        );

        //database interactions
        const data = await prisma.user.create({
            data: {
                id: uuidv7(),
                name,
                gender,
                gender_probability: Number(gender_probability.toFixed(2)),
                sample_size,
                age,
                age_group,
                country_id,
                country_probability: Number(country_probability.toFixed(2)),
                created_at: new Date().toISOString().replace("000", "")
            }
        })
        return res.status(201).json({
            "status": "success",
            data
        })

    } catch (error: any) {
        const err = new Error(error.message) as any;
        err.statusCode = 500
        return next(err)
    }
})

//fetch profile lists
app.get("/api/profiles", async (req, res, next) => {
    try {
        const { gender, country_id, age_group } = req.query

        const queryFilters: any = {}
        queryFilters.gender = {
            contains: gender,
            mode: "insensitive"
        }
        queryFilters.country_id = country_id && country_id
        queryFilters.age_group = age_group && age_group

        const response = await prisma.user.findMany({ where: queryFilters })
        if (!response) {
            const err = new Error("Profiles not found") as any
            err.statusCode = 404
            return next(err)
        }
        const data = response.map(item => {
            return {
                id: item.id,
                name: item.name,
                gender: item.gender,
                age: item.age,
                age_group: item.age_group,
                country_id: item.country_id
            }
        })
        return res.status(200).json({
            "status": "success",
            "count": data.length,
            "data": data
        })

    } catch (error: any) {
        const err = new Error(error.message) as any;
        err.statusCode =500
        return next(err)
    }
})

// fetch single profile

app.get("/api/profiles/:id", async (req, res, next) => {
    try {
        const { id } = req.params
        const data = await prisma.user.findUnique({ where: { id } })
        if (!data) {
            const err = new Error("Profile not found") as any
            err.statusCode = 404
            return next(err)
        }
        return res.status(200).json({
            "status": "success",
            data
        })

    } catch (error: any) {
        const err = new Error(error.message) as any;
        err.statusCode = 500
        return next(err)
    }
})


//delete a profile

app.delete("/api/profiles/:id", async (req, res, next) => {
    try {
        const { id } = req.params
        const data = await prisma.user.findUnique({ where: { id } })
        if (!data) {
            const err = new Error("Profiles not found") as any
            err.statusCode = 404
            return next(err)
        }
        await prisma.user.delete({
            where: { id }
        })
        return res.status(204)
    } catch (error: any) {
        const err = new Error(error.message) as any;
        err.statusCode = 500
        return next(err)
    }
})

//error handler middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.statusCode ? err.statusCode : 500
    return res.status(status).json({
        status: "error",
        message: err.message
    })
})


app.listen(3000, () => {
    console.log("server is live at 3000");

})