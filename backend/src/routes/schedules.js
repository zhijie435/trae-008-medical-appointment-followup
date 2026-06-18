async function scheduleRoutes(fastify) {
  const ctrl = fastify.controllers.schedule;

  fastify.get('/departments', ctrl.departments);
  fastify.get('/doctors', ctrl.doctors);
  fastify.post('/check-conflict', ctrl.checkConflict);
  fastify.get('/', ctrl.list);
  fastify.get('/month/:year/:month', ctrl.monthSchedule);
  fastify.get('/:id', ctrl.get);
  fastify.post('/', ctrl.create);
  fastify.put('/:id', ctrl.update);
  fastify.patch('/:id/status', ctrl.updateStatus);
  fastify.delete('/:id', ctrl.remove);
}

export default scheduleRoutes;
