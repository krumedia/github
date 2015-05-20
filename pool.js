var Promise = require('rsvp').Promise;

function Pool(count) {
  this.count = count;
  this.queue = [];
  this.promises = new Array(count);
}

/* Run the function immediately. */
function run(pool, idx, executionFunction) {
  var p = Promise.resolve()
    .then(executionFunction)
    .then(function() {
      delete pool.promises[idx];
      var next = pool.queue.pop();
      if (next)
        pool.execute(next);
    });
  pool.promises[idx] = p;
  return p;
}

/* Defer function to run once all running and queued functions have run. */
function enqueue(pool, executeFunction) {
  return new Promise(function(resolve) {
    pool.queue.push(function() {
      return Promise.resolve().then(executeFunction).then(resolve);
    });
  });
}

/* Take a function to execute within pool, and return promise delivering the functions
 * result immediately once it is run. */
Pool.prototype.execute = function(executionFunction) {
  var idx = -1;

  for (var i=0; i<this.count; i++)
    if (!this.promises[i])
      idx = i;

  if (idx !== -1)
    return run(this, idx, executionFunction);
  else
    return enqueue(this, executionFunction);
};

module.exports = Pool;
