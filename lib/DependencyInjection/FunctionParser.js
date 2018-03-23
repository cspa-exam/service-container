'use strict';

const DependencyInjectionError = require('./DependencyInjectionError');
const esprima = require('esprima');

class FunctionParser {

  static parse(func) {
    const result = {
      name: null,
      type: null,
      has_constructor: null,
      is_subclassed: null,
      argument_names: null,
    };

    const ast = getAst(func);
    switch (ast.body[0].type) {
      case 'ClassDeclaration': {
        result.name = ast.body[0].id.name;
        result.type = 'class';
        result.is_subclassed = !!(ast.body[0].superClass && ast.body[0].superClass.name);

        const class_body = ast.body[0].body; // ClassBody
        const constructor_definition = class_body.body.find(_method_definition => _method_definition.kind === 'constructor'); // MethodDefinition
        if (!constructor_definition) {
          result.argument_names = [];
          result.has_constructor = false;
        } else {
          const params = constructor_definition.value.params; // Array of Identifier OR AssignmentPattern (if uses default args)

          result.argument_names = getArgsFromParams(params);
          result.has_constructor = true;
        }

        break;
      }
      case 'FunctionDeclaration': {
        result.name = ast.body[0].id.name;
        result.type = 'function';
        result.has_constructor = false;
        result.is_subclassed = false;

        const params = ast.body[0].params; // Array of Identifier

        result.argument_names = getArgsFromParams(params);

        break;
      }
      default: {
        throw new DependencyInjectionError(
          'function_parser_invalid_ast_body_type',
          'Input was neither a valid function or class declaration?'
        );
      }
    }

    function getArgsFromParams(params) {
      return params.map(_param => {
        if ('AssignmentPattern' === _param.type) {
          return _param.left.name;
        } else {
          return _param.name;
        }
      }) || [];
    }

    return result;
  }

  /**
   * Provide a class prototype and this method will attempt to determine the constructor's argument names. It will
   * parse out the argument names as an array of strings and return it.
   *
   * https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically
   *
   * WARNING! This function will not work properly if the code is minified.
   *
   * @param func
   * @returns {Array}
   */
  static extractConstructorArguments(func) {
    const parse = FunctionParser.parse(func);

    const result = (() => {
      if ('class' === parse.type) {
        if (!parse.has_constructor) {
          throw new DependencyInjectionError(
            'function_parser_class_missing_constructor',
            'Class is missing a constructor.'
          );
        }
        return parse.argument_names;
      } else if ('function' === parse.type) {
        return parse.argument_names;
      } else {
        throw new DependencyInjectionError(
          'function_parser_constructor_invalid_ast_type',
          'Input was neither a valid function or class declaration?'
        );
      }
    })();

    // Do an extra paranoid check to ensure we didnt screw up somewhere
    if (result.length !== func.length) {

      // FIXME (derek) it seems func.length doesn't work properly for constructors with default arguments

      // throw new DependencyInjectionError(
      //   `????`,
      //   `Parsed ${result.length} arguments (${result.join()}) out of ${func.length} expected, for function ` +
      //   `prototype named "${func.name}". \n\nThis is likely due to non-standard class constructor syntax. When ` +
      //   `declaring a class for autowiring please check that you are doing the following: \n` +
      //   ` * Structure the service as a class or a function that accepts arguments that are other services\n` +
      //   ` * Name the function parameter exactly after the service Id of the other services, this is case-sensitive \n` +
      //   ` * Include the constructor, even if it's an empty constructor or it is inherited from a superclass\n` +
      //   ` * Do not use default parameters`
      // );
    }

    return result;
  }

}

module.exports = FunctionParser;

// Private methods
function getAst(func) {
  const func_string = func.toString();
  return esprima.parse(func_string);
}
