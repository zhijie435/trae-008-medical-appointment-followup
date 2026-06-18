async function followupRoutes(fastify) {
  const ctrl = fastify.controllers.followup;

  fastify.get('/', ctrl.list);
  fastify.get('/today/pending', ctrl.todayPending);
  fastify.get('/:id', ctrl.get);
  fastify.get('/patient/:patientId', ctrl.byPatient);
  fastify.post('/', ctrl.create);
  fastify.put('/:id', ctrl.update);
  fastify.patch('/:id/status', ctrl.updateStatus);
  fastify.delete('/:id', ctrl.remove);
}

export default followupRoutes;
