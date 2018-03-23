'use strict';

class DependencyInjectionError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
module.exports = DependencyInjectionError;
