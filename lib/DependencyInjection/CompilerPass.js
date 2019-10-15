"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DependencyInjectionError_1 = require("./DependencyInjectionError");
class CompilerPass {
    process(_service_container) {
        // Fill me in!
        throw new DependencyInjectionError_1.DependencyInjectionError('not_implemented', 'Not implemented!');
    }
}
exports.CompilerPass = CompilerPass;
