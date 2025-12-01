import { FastifyRequest, FastifyReply } from 'fastify'
import { orderFiltersSchema } from '../utils/validators'
import { OrderFilters } from '../types'
import { getOrders, getOrderById } from '../services/orders.service'

export async function listOrders(request: FastifyRequest, reply: FastifyReply) {
  const filters = orderFiltersSchema.parse(request.query as OrderFilters)
  const orders = await getOrders(filters)
  reply.status(200).send(orders)
}

export async function getOrder(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const id = parseInt(request.params.id, 10)
  const order = await getOrderById(id)
  reply.status(200).send(order)
}
