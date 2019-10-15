export declare class FunctionParser {
    static parse(func: Function): {
        name: string;
        type: string;
        is_subclassed: boolean;
        argument_names: string[];
        has_constructor: boolean;
    };
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
    static extractConstructorArguments(func: Function): string[];
}
