module.exports = {
  name: "policiais",
  events: {
    "velocidade.alta"(ctx) {
      const span = ctx.startSpan("Polícia Rodoviária");
      this.logger.warn("Velocidade alta registrada.")
      this.logger.warn("Placa:", ctx.params.placa);
      this.logger.warn("Velocidade:", ctx.params.velocidade);
      ctx.finishSpan(span);
    }
  }
};