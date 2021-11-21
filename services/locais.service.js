"use strict";
const DbMixin = require("../mixins/db.mixin");

module.exports = {
	name: "locais",
	mixins: [DbMixin("locais")],
	settings: {
		fields: [
			"_id",
			"categoria", //estacionamento - pedágio - posto - drive-thru - lavarapido - 
			"nome", //nome do estabelecimento ou da concessionária
			"endereco", //endereço ou km do pedágio
			"cidade",
			"uf",
			"tarifa",
			"criadoEm"
		],

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
			tarifa: "number",
		}
	},

	/**
	 * Action Hooks
	 */
	hooks: {
		before: {
			/**
			 * Register a before hook for the `create` action.
			 * It sets a default value for the quantity field.
			 */
			create(ctx) {
				// Add timestamp
				ctx.params.criadoEm = new Date();
				return ctx;
			}
		},

		after: {}
	},

	/**
	 * Actions
	 */
	actions: {
		/**
		 * The "moleculer-db" mixin registers the following actions:
		 *  - list
		 *  - find
		 *  - count
		 *  - create
		 *  - insert
		 *  - update
		 *  - remove
		 */
		seed: {
			// auth: "required",
			rest: "GET /seed",
			async handler(ctx) {
				// Create fake companies
				let sensor = await this.adapter.insertMany(_.times(1, () => {
					let tarifa = fake.random.arrayElement([1, 2]);
					let valor = tarifa === 1 ? 3 : 5;
					return {
						placa: fake.random.masked('AAA-9999'),
						tarifa: tarifa,
						valor: valor,
						criadoEm: new Date()
					};
				}));

				this.logger.info(`Foram gerados ${sensor.length} registros! Pelo Node: ${ctx.nodeID}`);
				return this.clearCache();
			}
		},
	},

	methods: {},

	/**
	 * Fired after database connection establishing.
	 */
	async afterConnected() {
		// await this.adapter.collection.createIndex({ placa: 1 });
	}

};
