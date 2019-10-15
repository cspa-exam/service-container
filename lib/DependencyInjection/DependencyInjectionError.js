"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DependencyInjectionError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
exports.DependencyInjectionError = DependencyInjectionError;
