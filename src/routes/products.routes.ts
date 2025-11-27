import { FastifyInstance } from "fastify";
import { listProducts } from "../controllers/products.controller";
import { authenticate } from "../middlewares/auth.middleware";

export default async function productRoutes(fastify:FastifyInstance){
    fastify.addHook('onRequest', authenticate);
    fastify.get(
        '/',
        {
            schema: {
                tags: ["Products"],
                description: "Lista produtos com filtros opcionais",
                querystring: {
                    type: "object",
                    properties: {
                        page: { type: "number" },
                        limit: { type: "number" },
                        minPrice: { type: "number" },
                        maxPrice: { type: "number" },
                        search: { type: "string" },
                        sortBy: { type: "string", enum: ["price", "name", "createdAt"] },
                        sortOrder: { type: "string", enum: ["asc", "desc"] },
                    },
                },
            },
        },
        listProducts
    );
}