'use strict';

const { expect } = require('chai');
const {
  ServiceContainer,
  ServiceReference,
} = require('../../index.js');

describe('ServiceContainer', function() {
  it('should be able to register and fetch a service', function() {
    const container = new ServiceContainer();
    const service = {
      fn: () => 'pass'
    };

    container.set('abc', service);

    expect(container.get('abc')).to.equal(service);
    expect(container.get('abc').fn()).to.equal('pass');
  });

  it('should be able to register and fetch a service using a builder', function() {
    const container = new ServiceContainer();
    const builder = (service_container) => {
      return {
        fn: () => 'pass'
      };
    };

    container.registerFactory('abc', builder);

    expect(container.get('abc')).to.respondTo('fn');
    expect(container.get('abc').fn()).to.equal('pass');
  });

  it('should not be able to register services when frozen', function() {
    const container = new ServiceContainer();
    const a = 1;
    const b = 2;

    container.set('a', a);
    container.freeze();

    expect(() => container.set('b', b)).to.throw();
  });

  it('should not be able to register when an id has already been taken', function() {
    const container = new ServiceContainer();
    const a = 1;
    const b = 2;

    container.set('a', a);

    expect(() => container.set('a', b)).to.throw();
  });

  it('should be able to return a list of all service ids', function() {
    const container = new ServiceContainer();

    container.set('a', 1);
    container.set('b', 2);
    container.set('c', 3);

    expect(container.getServiceIds()).to.deep.equal(['service_container', 'a', 'b', 'c']);
  });

  it('should be able to return a list of all service ids including aliases', function() {
    const container = new ServiceContainer();

    container.set('a', 1);
    container.set('b', 2);
    container.set('c', 3);
    container.alias('d', 'a');

    expect(container.getServiceIds()).to.deep.equal(['service_container', 'a', 'b', 'c', 'd']);
  });


  it('should recommend to you some other service ids when you misspell one', function() {
    const container = new ServiceContainer();

    container.set('hello.world', 1);

    expect(() => container.get('hello.wolrd')).to.throw(/did you actually mean "hello\.world"\?/);
  });

  it('should be able to register and fetch a service using ServiceDefinitions', function() {
    const container = new ServiceContainer();

    function AsdfClass() {
      this.a = 1;
    }
    function QwertyClass(asdf) {
      this.Asdf = asdf;
      this.b = this.Asdf.a;
    }

    container.register('a', AsdfClass);
    container.register('b', QwertyClass)
      .setArguments([ new ServiceReference('a') ]);

    expect(container.get('a').a).to.equal(1);
    expect(container.get('b').b).to.equal(1);
  });

  it('should be able to register and fetch a service using simple definition', function() {
    const container = new ServiceContainer();

    function AsdfClass() {
      this.a = 1;
    }
    function QwertyClass(asdf) {
      this.Asdf = asdf;
      this.b = this.Asdf.a;
    }

    container.register('a', AsdfClass);
    container.register('b', QwertyClass)
      .setArguments([ new ServiceReference('a') ]);

    expect(container.get('a').a).to.equal(1);
    expect(container.get('b').b).to.equal(1);
  });

  it('should support aliases', function() {
    const container = new ServiceContainer();
    const service = {
      fn: () => 'pass'
    };

    container.set('abc', service);

    expect(() => container.get('def')).to.throw();

    container.alias('def', 'abc');

    expect(container.get('def')).to.equal(service);
    expect(container.get('def').fn()).to.equal('pass');
    expect(container.get('abc')).to.equal(container.get('def'));
  });

  describe('autowiring', () => {
    class Foo {
      constructor(Bar) {
        this.Bar = Bar;
      }

      fuz() {
        return this.Bar.buz();
      }
    }
    function Bar(message) {
      this.buz = () => message;
    }

    it('can autowire', () => {
      const container = new ServiceContainer();

      container.autowire('Foo', Foo);
      container.register('Bar', Bar).setArguments([ 'message goes here' ]);

      expect(container.get('Foo')).to.be.an.instanceof(Foo);
      expect(container.get('Foo').fuz()).to.equal('message goes here');
    });
  });

  describe('registering definitions', () => {
    it('can include addMethodCall', () => {
      class Foo {
        setMessage(a) { this.m = a }
        get() { return this.m }
      }

      const container = new ServiceContainer();
      container.register('Foo', Foo).addMethodCall('setMessage', ['bah humbug']);

      expect(container.get('Foo').get()).to.equal('bah humbug');
    });

    it('can respect setArguments', () => {
      class Foo {
        constructor(a, b, c) {
          this.message = a + ' went to the ' + b + ' so it could ' + c;
        }
      }

      const container = new ServiceContainer();
      container.register('Foo', Foo).setArguments(['Pig', 'market', 'buy cheese']);

      expect(container.get('Foo').message).to.equal('Pig went to the market so it could buy cheese');
    });

    it('can add tags', () => {
      class Foo {
      }
      class Bar {
      }

      const container = new ServiceContainer();
      container.register('Foo', Foo).addTag('a_foo').addTag('not_bar');
      container.register('Bar', Foo).addTag('a_foo').addTag('bar');

      expect(container.findTaggedServiceIds('a_foo')).to.deep.equal(['Foo', 'Bar']);
      expect(container.findTaggedServiceIds('not_bar')).to.deep.equal(['Foo']);
    });

    it('can run compiler passes', () => {
      class Foo {
        buz() {
          return '2';
        }
      }
      class Bar {
        constructor() {
          this.a = 'A';
          this.Foo = null;
        }
        setFoo(foo) {
          this.Foo = foo;
        }
        baz() {
          return this.a + this.Foo.buz();
        }
      }
      class CompilerPass {
        process(container) {
          container.findTaggedServiceIds('needs_foo').forEach(id => {
            container.getDefinition(id).addMethodCall('setFoo', [new ServiceReference('Foo')]);
          });
        }
      }

      const container = new ServiceContainer();
      container.register('Foo', Foo);
      container.register('Bar', Bar).addTag('needs_foo');

      container.addCompilerPass(new CompilerPass());

      expect(container.get('Bar').baz()).to.equal('A2');
    });
  });

  describe('error handling while registering definitions', () => {
    it('can detect and handle service cycles', () => {
      const container = new ServiceContainer();
      class Foo {
        constructor(Bar) {}
      }
      class Bar {
        constructor(Baz) {}
      }
      class Baz {
        constructor(Foo) {}
      }
      container.autowire('Foo', Foo);
      container.autowire('Bar', Bar);
      container.autowire('Baz', Baz);

      expect(() => container.compile()).to.throw('ServiceContainer Error: Cyclical service dependency detected on (Foo -> Bar -> Baz -> Foo)');
    });
  });
});
