
import "dotenv/config"
import express, { Application, NextFunction, Request, Response } from "express"
import cors from "cors"
import { classifyAge } from "./src/utils.js";
import prisma from "./src/prisma.js";
import { v7 as uuidv7 } from "uuid"

interface TGenderize {
    count: number;
    name: string;
    gender: string;
    probability: number
}
interface TAgify {
    count: number;
    name: string;
    age: number
}
interface TNationalize {
    count: number;
    name: string;
    country: {
        country_id: string;
        probability: number
    }[]
}

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
            return res.json({
                "status": "success",
                "message": "Profile already exists",
                data: isExist
            })
        }
        //fetching apis

        const fetchGenderize = (): Promise<TGenderize> => fetch(`https://api.genderize.io/?name=${name}`).then(res => res.json())
        const fetchAgify = (): Promise<TAgify> => fetch(`https://api.agify.io/?name=${name}`).then(res => res.json())
        const fetchNationalize = (): Promise<TNationalize> => fetch(`https://api.nationalize.io/?name=${name}`).then(res => res.json())

        const response = await Promise.allSettled([
            fetchGenderize(),
            fetchAgify(),
            fetchNationalize()
        ])
        const [genderize, agify, nationalize] = response

        if (genderize.status === "rejected" || agify.status === "rejected" || nationalize.status === "rejected") {
            const err = new Error("request failed, pease try again") as any
            err.statusCode = 500
            return next(err)
        }

        if (
            genderize.value.gender === null ||
            genderize.value.count === 0 ||
            agify.value.age === null ||
            nationalize.value.count === 0 ||
            nationalize.value.country.length === 0
        ) {
            const err = new Error("name not found") as any
            err.statusCode = 404
            return next(err)
        }

        const { gender, probability: gender_probability, count: sample_size } = genderize.value
        const { age } = agify.value
        const { country } = nationalize.value

        const age_group = classifyAge(age)
        const {country_id,probability:country_probability} = country.reduce((prev, current) =>
            (current.probability > prev.probability) ? current : prev
        );

        //database interactions
        const data = await prisma.user.create({
            data: {
                id: uuidv7(),
                name,
                gender,
                gender_probability,
                sample_size,
                age,
                age_group,
                country_id,
                country_probability
            }
        })
        return res.json({
            "status": "success",
            data
        })

    } catch (error:any) {
        const err = new Error(error.message) as any;
        err.statusCode = 500
        return next(err)
    }
})

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