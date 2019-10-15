import { DependencyInjectionError } from'./DependencyInjectionError';
import { Program, Pattern, Identifier } from 'estree';
const esprima = require('esprima');

export class FunctionParser {

  static parse(func: Function) {
    const ast = getAst(func);
    const node = ast.body[0]

    switch (node.type) {
      case 'ClassDeclaration': {

        const class_body = node.body; // ClassBody
        const constructor_definition = class_body.body.find(_method_definition => _method_definition.kind === 'constructor'); // MethodDefinition

        if (!node.id) {
          throw new DependencyInjectionError(
            'function_parser_no_function_id',
            `Class declaration must have a name: [${func.toString()}]`
          )
        }

        return {
          name: node.id.name,
          type: 'class',
          is_subclassed: !!(node.superClass && (node.superClass as any).name),
          argument_names: constructor_definition
            ? getArgsFromParams(constructor_definition.value.params)
            : []
          ,
          has_constructor: !!constructor_definition,
        }
      }
      case 'FunctionDeclaration': {
        if (!node.id) {
          throw new DependencyInjectionError(
            'function_parser_no_function_id',
            `Function declaration must have a name: [${func.toString()}]`
          )
        }
        return {
          name: node.id.name,
          type: 'function',
          has_constructor: false,
          is_subclassed: false,
          argument_names: getArgsFromParams(node.params /* Array of Identifier */)
        }
      }
      default: {
        throw new DependencyInjectionError(
          'function_parser_invalid_ast_body_type',
          'Input was neither a valid function or class declaration?'
        );
      }
    }

    function getArgsFromParams(params: Pattern[]) {
      return params.map(_param => {
        if ('AssignmentPattern' === _param.type) {
          return (_param.left as Identifier).name;
        } else if ('Identifier' === _param.type) {
          return _param.name;
        }
        else {
          throw new DependencyInjectionError(
            'function_parser_unsupported_parameter',
            `Unsupported parameter syntax in [${func.toString()}]`
          )
        }
      }) || [];
    }
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
  static extractConstructorArguments(func: Function) {
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

// Private methods
function getAst(func: Function) {
  const func_string = func.toString();
  return esprima.parse(func_string) as Program;
}
