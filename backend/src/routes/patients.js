async function patientRoutes(fastify) {
  const ctrl = fastify.controllers.patient;

  fastify.get('/', ctrl.list);
  fastify.get('/departments', ctrl.departments);
  fastify.get('/all', ctrl.all);
  fastify.get('/:id', ctrl.get);
  fastify.post('/', ctrl.create);
  fastify.put('/:id', ctrl.update);
  fastify.delete('/:id', ctrl.remove);
}

export default patientRoutes;
