"use strict";
const Fakerator = require("fakerator");
const fake = new Fakerator("pt-BR");
const _ = require("lodash");
const DbMixin = require("../mixins/db.mixin");

module.exports = {
	name: "sensores",
	mixins: [DbMixin("sensores")],
	settings: {
		fields: [
			"_id",
			"local",
			"fator", //Qtde de  Eixos ou da Compra que será usado no cálculo do valor
			"placa",
			"valor",
			"velocidade",
			"criadoEm",
			"node"
		],

		populates: {
			"local": {
				action: "locais.get",
				params: {
					fields: ["categoria", "nome", "tarifa"]
				}
			}
		},

		// Default page size in list action
		//Se não for passado esse parâmetro pelo cliente, 
		//vai trazer 1000 registros por página
		pageSize: 1000,

		// Maximum page size in list action
		// Limite máximo suportado pela API
		maxPageSize: 1000,

		// Maximum value of limit in find action. Default: -1 (no limit)
		maxLimit: -1,

		// Validator for the `create` & `insert` actions.
		entityValidator: {
			// placa: { type: "string", pattern: '[a-zA-Z]{3}[0-9]{1}[a-zA-Z]{1}[0-9]{2}' },
			placa: { type: "string", pattern: '[a-zA-Z]{3}[0-9]{4}' },
			fator: { type: "number", positive: "true" }
		}
	},

	/**
	 * Action Hooks
	 */
	hooks: {
		before: {
			/**
			 * Register a before hook for the `create` action.
			 */
			async create(ctx) {
				// Add timestamp
				ctx.params.criadoEm = new Date();
				const local = await ctx.call("locais.get", { id: ctx.params.local });
				ctx.params.valor = ctx.params.fator * local.tarifa;
				return ctx;
			}
		},

		after: {}
	},

	/**
	 * Actions
	 */
	actions: {
		listar: {
			rest: "GET /",
			async handler(ctx) {
				let data = await ctx.call("sensores.list", { populate: ["local"] });
				return data;
			}
		},

		seed: {
			// auth: "required",
			rest: "POST /seed",
			async handler(ctx) {
				// Increment metric
				this.broker.metrics.increment("sensores.seed.total", { "sensorID": this.broker.nodeID }, 1);

				const resLocais = await ctx.call("locais.find", { fields: ["_id"] });
				const locais = [];
				resLocais.forEach(element => {
					locais.push(element._id);
				});

				const sensor = {};
				sensor.local = fake.random.arrayElement(locais);
				sensor.fator = fake.random.arrayElement([1, 2, 3]);
				sensor.placa = fake.random.masked('AAA9999');
				sensor.velocidade = fake.random.number(30, 50);
				if (sensor.velocidade >= 40) {
					ctx.emit("velocidade.alta", { placa: sensor.placa, velocidade: sensor.velocidade });
				}				
				sensor.node = this.broker.nodeID.split("-")[0];
				const sensorCriado = ctx.call("sensores.create", { local: sensor.local, fator: sensor.fator, placa: sensor.placa, velocidade: sensor.velocidade, node: sensor.node });
				
				this.clearCache();
				return sensorCriado;
			}
		},
	},

	created() {
		//Registrar métrica
		this.broker.metrics.register({ 
				type: "gauge", 
				name: "sensores.seed.total", 
				description: "Número de Requests recebidas", 
				labelNames: ["sensorID"],
				unit: "request",
				rate: true // calculate 1-minute rate
		});
},

	methods: {},

	/**
	 * Fired after database connection establishing.
	 */
	async afterConnected() {
		// await this.adapter.collection.createIndex({ placa: 1 });
	}

};
