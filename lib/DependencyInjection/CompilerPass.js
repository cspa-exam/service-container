'use strict';

const DependencyInjectionError = require('./DependencyInjectionError');

class CompilerPass {

  process(service_container) {
    // Fill me in!
    throw new DependencyInjectionError('not_implemented', 'Not implemented!');
  }

}
module.exports = CompilerPass;
