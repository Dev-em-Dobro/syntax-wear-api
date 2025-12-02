import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app";
import { prisma } from "../src/utils/prisma";
import { FastifyInstance } from "fastify";
import { slugify } from "zod";
import { access } from "fs";

describe("Products CRUD", () => {
	let app: FastifyInstance;
	let adminToken: string;
	let testCategoryId: number;
	let testProductId: number;

	beforeAll(async () => {
		app = await buildApp();

		// Cria um admin para os testes
		const adminEmail = `admin-products-${Date.now()}@example.com`;
		const registerResponse = await app.inject({
			method: "POST",
			url: "/auth/register",
			payload: {
				firstName: "Admin",
				lastName: "Products",
				email: adminEmail,
				password: "admin123",
			},
		});

		const adminData = JSON.parse(registerResponse.body);
		const adminUserId = adminData.user.id;

		// Atualiza o usuário para ADMIN
		await prisma.user.update({
			where: { id: adminUserId },
			data: { role: "ADMIN" },
		});

		// Faz login como admin
		const loginResponse = await app.inject({
			method: "POST",
			url: "/auth/login",
			payload: {
				email: adminEmail,
				password: "admin123",
			},
		});

		adminToken = JSON.parse(loginResponse.body).token;

		// Cria uma categoria de teste
		const category = await prisma.category.create({
			data: {
				name: `Test Category ${Date.now()}`,
				slug: `test-category-${Date.now()}`,
				description: "Categoria para testes",
			},
		});

		testCategoryId = category.id;
	}, 15000);

	afterAll(async () => {
		// Limpa produtos de teste
		await prisma.product.deleteMany({
			where: {
				name: {
					contains: "Test Product",
				},
			},
		});

		// Limpa categoria de teste
		await prisma.category.deleteMany({
			where: {
				name: {
					contains: "Test Category",
				},
			},
		});

		// Limpa usuário admin de teste
		await prisma.user.deleteMany({
			where: {
				email: {
					contains: "admin-products-",
				},
			},
		});

		await app.close();
	});

	describe("POST /products - Criar produto", () => {
		it("deve criar um novo produto com sucesso (admin)", async () => {
			const productData = {
				name: "Test Product 1",
				description: "Descrição do produto de teste",
				price: 99.99,
				categoryId: testCategoryId,
				stock: 10,
				colors: ["Preto", "Branco"],
				sizes: ["M", "G", "GG"],
				images: ["https://example.com/image1.jpg"],
                active: true,
                slug: "test-product-1",
			};

			const response = await app.inject({
				method: "POST",
				url: "/products",
				headers: {
					authorization: `Bearer ${adminToken}`,
				},
				payload: productData,
			});

            

			expect(response.statusCode).toBe(201);

			const body = JSON.parse(response.body);
			expect(body).toHaveProperty("message");
			expect(body.message).toBe("Produto criado com sucesso");

			// Verifica se o produto foi criado no banco
			const product = await prisma.product.findFirst({
				where: { name: "Test Product 1" },
			});

			expect(product).toBeTruthy();
			expect(product?.slug).toBe("test-product-1");
			expect(product?.price.toFixed(2)).toBe("99.99");
			expect(product?.stock).toBe(10);

			testProductId = product!.id;
		});

		it("deve retornar erro ao criar produto sem autenticação", async () => {
			const productData = {
				name: "Test Product Unauthorized",
				description: "Produto não autorizado",
				price: 50.0,
				categoryId: testCategoryId,
			};

			const response = await app.inject({
				method: "POST",
				url: "/products",
				payload: productData,
			});

			expect(response.statusCode).toBeGreaterThanOrEqual(401);
		});

		it("deve retornar erro ao criar produto sem campos obrigatórios", async () => {
			const productData = {
				name: "Test Product Incomplete",
				// Faltando description, price e categoryId
			};

			const response = await app.inject({
				method: "POST",
				url: "/products",
				headers: {
					authorization: `Bearer ${adminToken}`,
				},
				payload: productData,
			});

			expect(response.statusCode).toBe(400);
		});

		it("deve retornar erro ao criar produto com categoryId inválido", async () => {
			const productData = {
				name: "Test Product Invalid Category",
				description: "Produto com categoria inválida",
				price: 99.99,
				categoryId: 999999, // ID que não existe
			};

			const response = await app.inject({
				method: "POST",
				url: "/products",
				headers: {
					authorization: `Bearer ${adminToken}`,
				},
				payload: productData,
			});

			expect(response.statusCode).toBeGreaterThanOrEqual(400);
		});
	});

	describe("GET /products - Listar produtos", () => {
		it("deve listar produtos sem autenticação", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/products",
			});

			expect(response.statusCode).toBe(200);

			const body = JSON.parse(response.body);
			expect(body).toHaveProperty("data");
			expect(body).toHaveProperty("total");
			expect(body).toHaveProperty("page");
			expect(body).toHaveProperty("limit");
			expect(body).toHaveProperty("totalPages");
			expect(Array.isArray(body.data)).toBe(true);
		});

		it("deve listar produtos com paginação", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/products?page=1&limit=5",
			});

			expect(response.statusCode).toBe(200);

			const body = JSON.parse(response.body);
			expect(body.page).toBe(1);
			expect(body.limit).toBe(5);
			expect(body.data.length).toBeLessThanOrEqual(5);
		});

		it("deve filtrar produtos por preço mínimo e máximo", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/products?minPrice=50&maxPrice=150",
			});

			expect(response.statusCode).toBe(200);

			const body = JSON.parse(response.body);
			body.data.forEach((product: any) => {
				expect(Number(product.price)).toBeGreaterThanOrEqual(50);
				expect(Number(product.price)).toBeLessThanOrEqual(150);
			});
		});

		it("deve buscar produtos por nome", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/products?search=Test Product 1",
			});

			expect(response.statusCode).toBe(200);

			const body = JSON.parse(response.body);
			expect(body.data.length).toBeGreaterThan(0);
		});

		it("deve filtrar produtos por categoria", async () => {
			const response = await app.inject({
				method: "GET",
				url: `/products?categoryId=${testCategoryId}`,
			});

			expect(response.statusCode).toBe(200);

			const body = JSON.parse(response.body);
			body.data.forEach((product: any) => {
				expect(product.categoryId).toBe(testCategoryId);
			});
		});

		it("deve ordenar produtos por preço", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/products?sortBy=price&sortOrder=asc",
			});

			expect(response.statusCode).toBe(200);

			const body = JSON.parse(response.body);
			if (body.data.length > 1) {
				for (let i = 0; i < body.data.length - 1; i++) {
					expect(Number(body.data[i].price)).toBeLessThanOrEqual(
						Number(body.data[i + 1].price)
					);
				}
			}
		});
	});

	describe("GET /products/:id - Obter produto por ID", () => {
		it("deve obter um produto pelo ID", async () => {
			const response = await app.inject({
				method: "GET",
				url: `/products/${testProductId}`,
			});

			expect(response.statusCode).toBe(200);

			const body = JSON.parse(response.body);
			expect(body).toHaveProperty("id");
			expect(body.id).toBe(testProductId);
			expect(body).toHaveProperty("name");
			expect(body).toHaveProperty("price");
			expect(body).toHaveProperty("category");
			expect(body.category).toHaveProperty("id");
			expect(body.category.id).toBe(testCategoryId);
		});

		it("deve retornar erro ao buscar produto com ID inválido", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/products/999999",
			});

			expect(response.statusCode).toBeGreaterThanOrEqual(400);
		});
	});

	describe("PUT /products/:id - Atualizar produto", () => {
		it("deve atualizar um produto com sucesso (admin)", async () => {
			const updateData = {
				name: "Test Product 1 Updated",
				price: 149.99,
				stock: 20,
			};

			const response = await app.inject({
				method: "PUT",
				url: `/products/${testProductId}`,
				headers: {
					authorization: `Bearer ${adminToken}`,
				},
				payload: updateData,
			});

			expect(response.statusCode).toBe(200);

			const body = JSON.parse(response.body);
			expect(body.name).toBe("Test Product 1 Updated");
			expect(body.slug).toBe("test-product-1-updated");
			expect(Number(body.price)).toBe(149.99);

			// Verifica no banco
			const product = await prisma.product.findUnique({
				where: { id: testProductId },
			});

			expect(product?.name).toBe("Test Product 1 Updated");
			expect(product?.price.toString()).toBe("149.99");
			expect(product?.stock).toBe(20);
		});

		it("deve retornar erro ao atualizar produto sem autenticação", async () => {
			const updateData = {
				name: "Unauthorized Update",
			};

			const response = await app.inject({
				method: "PUT",
				url: `/products/${testProductId}`,
				payload: updateData,
			});

			expect(response.statusCode).toBeGreaterThanOrEqual(401);
		});

		it("deve retornar erro ao atualizar produto com ID inválido", async () => {
			const updateData = {
				name: "Product Not Found",
			};

			const response = await app.inject({
				method: "PUT",
				url: "/products/999999",
				headers: {
					authorization: `Bearer ${adminToken}`,
				},
				payload: updateData,
			});

			expect(response.statusCode).toBeGreaterThanOrEqual(400);
		});

		it("deve atualizar apenas campos específicos", async () => {
			const updateData = {
				stock: 50,
			};

			const response = await app.inject({
				method: "PUT",
				url: `/products/${testProductId}`,
				headers: {
					authorization: `Bearer ${adminToken}`,
				},
				payload: updateData,
			});

			expect(response.statusCode).toBe(200);

			const body = JSON.parse(response.body);
			expect(body.stock).toBe(50);
			// Nome deve permanecer o mesmo
			expect(body.name).toBe("Test Product 1 Updated");
		});
	});

	describe("DELETE /products/:id - Deletar produto (soft delete)", () => {
		it("deve fazer soft delete de um produto (admin)", async () => {
			const response = await app.inject({
				method: "DELETE",
				url: `/products/${testProductId}`,
				headers: {
					authorization: `Bearer ${adminToken}`,
				},
			});

			expect(response.statusCode).toBe(204);

			// Verifica se foi soft delete (active = false)
			const product = await prisma.product.findUnique({
				where: { id: testProductId },
			});

			expect(product).toBeTruthy();
			expect(product?.active).toBe(false);
		});

		it("deve retornar erro ao deletar produto sem autenticação", async () => {
			const response = await app.inject({
				method: "DELETE",
				url: `/products/${testProductId}`,
			});

			expect(response.statusCode).toBeGreaterThanOrEqual(401);
		});

		it("deve retornar erro ao deletar produto com ID inválido", async () => {
			const response = await app.inject({
				method: "DELETE",
				url: "/products/999999",
				headers: {
					authorization: `Bearer ${adminToken}`,
				},
			});

			expect(response.statusCode).toBeGreaterThanOrEqual(400);
		});

		it("produto deletado não deve aparecer na listagem padrão", async () => {
			const response = await app.inject({
				method: "GET",
				url: "/products",
			});

			expect(response.statusCode).toBe(200);

			const body = JSON.parse(response.body);
			const deletedProduct = body.data.find(
				(p: any) => p.id === testProductId
			);

			// Produto deletado (active=false) não deve aparecer
			expect(deletedProduct).toBeFalsy();
		});
	});
});
