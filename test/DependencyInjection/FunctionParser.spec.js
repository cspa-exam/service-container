'use strict';

const { expect } = require('chai');
const FunctionParser = require('../../lib/DependencyInjection/FunctionParser');

describe('FunctionParser', () => {
  describe('#parse', () => {
    it('correctly parses a function', () => {
      function foobarbaz(cate, doge, puppers) {
        return 42;
      }

      expect(FunctionParser.parse(foobarbaz)).to.deep.equal({
        name: 'foobarbaz',
        type: 'function',
        has_constructor: false,
        is_subclassed: false,
        argument_names: [ 'cate', 'doge', 'puppers' ],
      });
    });

    it('correctly parses an empty class', () => {
      class FooBarBaz {
      }

      expect(FunctionParser.parse(FooBarBaz)).to.deep.equal({
        name: 'FooBarBaz',
        type: 'class',
        has_constructor: false,
        is_subclassed: false,
        argument_names: [ ],
      });
    });

    it('correctly parses a class', () => {
      class ToBeOrNotToBe {
        constructor(call, me, nines) {
          this.a = '2B';
        }
      }

      expect(FunctionParser.parse(ToBeOrNotToBe)).to.deep.equal({
        name: 'ToBeOrNotToBe',
        type: 'class',
        has_constructor: true,
        is_subclassed: false,
        argument_names: [ 'call', 'me', 'nines' ],
      });
    });

    it('correctly identifies a subclass', () => {
      class SuperClass {
        constructor(a) {this.b = a;}
      }
      class JustSomeSubclass extends SuperClass {
        constructor(notlikethis) {
          super(notlikethis);
          this.a = '2B';
        }
      }

      expect(FunctionParser.parse(JustSomeSubclass)).to.deep.equal({
        name: 'JustSomeSubclass',
        type: 'class',
        has_constructor: true,
        is_subclassed: true,
        argument_names: [ 'notlikethis' ],
      });
    });
  });

  describe('#extractConstructorArguments', () => {

    // Notably this has to be supported because babel transpiles all of your classes into functions
    it('it correctly parses arguments from a function constructor', () => {
      function Foobar(a, b, c) {
      }

      expect(FunctionParser.extractConstructorArguments(Foobar)).to.deep.equal(['a', 'b', 'c']);
    });

    it('it correctly parses arguments from class with an empty constructor', () => {
      class Foobar {
        constructor() {}
      }

      expect(FunctionParser.extractConstructorArguments(Foobar)).to.deep.equal([]);
    });

    it('it correctly parses arguments from a class with a constructor with 1 argument', () => {
      class Foobar {
        constructor(abc) {}
      }

      expect(FunctionParser.extractConstructorArguments(Foobar)).to.deep.equal(['abc']);
    });

    it('it correctly parses arguments from a constructor with special characters', () => {
      class Foobar {
        constructor($abc_erh) {}
      }

      expect(FunctionParser.extractConstructorArguments(Foobar)).to.deep.equal(['$abc_erh']);
    });

    it('it correctly parses arguments from a constructor with... really special characters', () => {
      class Foobar {
        constructor(ლ_ಠ益ಠ_ლ, Ꙭൽↈⴱ) {
          this.foo = ლ_ಠ益ಠ_ლ;
        }
      }

      expect(FunctionParser.extractConstructorArguments(Foobar)).to.deep.equal(['ლ_ಠ益ಠ_ლ', 'Ꙭൽↈⴱ']);
    });

    it('it correctly parses arguments from a constructor with... ... why am I even supporting this', () => {
      class Foobar {
        constructor(Hͫ̆̒̐ͣ̊̄ͯ͗͏̵̗̻̰̠̬͝ͅE̴̷̬͎̱̘͇͍̾ͦ͊͒͊̓̓̐_̫̠̱̩̭̤͈̑̎̋ͮͩ̒͑̾͋͘Ç̳͕̯̭̱̲̣̠̜͋̍O̴̦̗̯̹̼ͭ̐ͨ̊̈͘͠M̶̝̠̭̭̤̻͓͑̓̊ͣͤ̎͟͠E̢̞̮̹͍̞̳̣ͣͪ͐̈T̡̯̳̭̜̠͕͌̈́̽̿ͤ̿̅̑Ḧ̱̱̺̰̳̹̘̰́̏ͪ̂̽͂̀͠) {
          this.foo = Hͫ̆̒̐ͣ̊̄ͯ͗͏̵̗̻̰̠̬͝ͅE̴̷̬͎̱̘͇͍̾ͦ͊͒͊̓̓̐_̫̠̱̩̭̤͈̑̎̋ͮͩ̒͑̾͋͘Ç̳͕̯̭̱̲̣̠̜͋̍O̴̦̗̯̹̼ͭ̐ͨ̊̈͘͠M̶̝̠̭̭̤̻͓͑̓̊ͣͤ̎͟͠E̢̞̮̹͍̞̳̣ͣͪ͐̈T̡̯̳̭̜̠͕͌̈́̽̿ͤ̿̅̑Ḧ̱̱̺̰̳̹̘̰́̏ͪ̂̽͂̀͠;
        }
      }

      expect(FunctionParser.extractConstructorArguments(Foobar)).to.deep.equal(['Hͫ̆̒̐ͣ̊̄ͯ͗͏̵̗̻̰̠̬͝ͅE̴̷̬͎̱̘͇͍̾ͦ͊͒͊̓̓̐_̫̠̱̩̭̤͈̑̎̋ͮͩ̒͑̾͋͘Ç̳͕̯̭̱̲̣̠̜͋̍O̴̦̗̯̹̼ͭ̐ͨ̊̈͘͠M̶̝̠̭̭̤̻͓͑̓̊ͣͤ̎͟͠E̢̞̮̹͍̞̳̣ͣͪ͐̈T̡̯̳̭̜̠͕͌̈́̽̿ͤ̿̅̑Ḧ̱̱̺̰̳̹̘̰́̏ͪ̂̽͂̀͠']);
    });

    it('it correctly parses arguments from a class with an inline require extends statement', () => {
      // This is to emulate when we do an inline require
      class Foobar extends req('asdf') {
        constructor(hello_world) {
          super();
        }
      }
      function req(arg) {
        return class SuperClass {
          constructor() {
            this.fourty = 30;
          }
        }
      }

      expect(FunctionParser.extractConstructorArguments(Foobar)).to.deep.equal(['hello_world']);
    });

    // This behavior is hard to support and is likely not a intended behavior with the autowiring
    it('it correctly parses arguments from a class with a constructor with default values', () => {
      class Foobar {
        constructor(a = 'a', b = 'b', thing = 42) {

        }
      }

      expect(FunctionParser.extractConstructorArguments(Foobar)).to.deep.equal(['a', 'b', 'thing']);
    });

    // This is not intended behavior.
    it('it errors when the class is missing its constructor', () => {
      class Foobar {
        whoops() { return 42; }
      }

      expect(() => FunctionParser.extractConstructorArguments(Foobar)).to.throw('Class is missing a constructor');
    });

    // This is simply not possible to do... even esprima cant parse this information out
    it.skip('it correctly parses arguments from a class that inherits its constructor', () => {
      class Foobar {
        constructor(hello) { this.twenty = 42; this.hello = hello; }
        whoops() { return this.hello; }
      }
      class BasedFoobar extends Foobar {
        bah() {
          return this.twenty;
        }
      }


      expect(FunctionParser.extractConstructorArguments(BasedFoobar)).to.deep.equal(['hello']);
    });

    it('it correctly parses arguments from a class with multiline constructor', () => {
      class Foobar {
        constructor(
          hello,
          nope,
          yep,
          things
        ) {
          this.twenty = 42; this.hello = hello;
        }
      }

      expect(FunctionParser.extractConstructorArguments(Foobar)).to.deep.equal(['hello', 'nope', 'yep', 'things']);
    });
  });
});
