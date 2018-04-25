'use strict';

const sinon = require('sinon');
const { expect } = require('chai');

const { JsonLoader, ServiceContainer } = require('../../../index');

describe('JsonLoader', function() {

  describe('unit tests', function() {
    it('loads simplified constructors properly', function() {
      class A { }

      const json = {
        service_a: A,
      };

      const spy = sinon.spy();
      const container = {
        autowire: spy,
      };

      const loader = new JsonLoader(container);

      loader.load(json);

      expect(spy.calledOnce).to.be.true;
      expect(spy.calledWith('service_a', A)).to.be.true;
    });

    it('loads aliases properly', function() {
      const json = {
        service_a: '@service_b',
      };

      const spy = sinon.spy();
      const container = {
        alias: spy,
      };

      const loader = new JsonLoader(container);

      loader.load(json);

      expect(spy.calledOnce).to.be.true;
      expect(spy.calledWith('service_a', 'service_b')).to.be.true;
    });

    it('sets strings into container', function() {
      const json = {
        param_a: 'foobar',
      };

      const spy = sinon.spy();
      const container = {
        set: spy,
      };

      const loader = new JsonLoader(container);

      loader.load(json);

      expect(spy.calledOnce).to.be.true;
      expect(spy.calledWith('param_a', 'foobar')).to.be.true;
    });

    it('sets strings into container', function() {
      const json = {
        param_a: 'foobar',
      };

      const spy = sinon.spy();
      const container = {
        set: spy,
      };

      const loader = new JsonLoader(container);

      loader.load(json);

      expect(spy.calledOnce).to.be.true;
      expect(spy.calledWith('param_a', 'foobar')).to.be.true;
    });

    it('autowires object configurations by default', function() {
      class A {}
      const json = {
        service_a: {
          constructor: A,
        },
      };

      const spy = sinon.spy();
      const container = {
        autowire: spy,
      };

      const loader = new JsonLoader(container);

      loader.load(json);

      expect(spy.calledOnce).to.be.true;
      expect(spy.calledWith('service_a', A)).to.be.true;
    });

    it('supports explicit argument passing', function() {
      class A {}
      const json = {
        service_a: {
          constructor: A,
          autowire: false,
          args: [ 'a', 'b', 'c' ],
        },
      };

      const setArguments = sinon.spy();
      const definition = { setArguments };

      const register = sinon.stub().returns(definition);
      const container = { register };


      const loader = new JsonLoader(container);

      loader.load(json);

      expect(register.calledOnce).to.be.true;
      expect(register.calledWith('service_a', A)).to.be.true;
      expect(setArguments.calledOnce).to.be.true;
      expect(setArguments.calledWith(['a', 'b', 'c'])).to.be.true;
    });

    it('converts @ arguments to service references', function() {
      class A {}
      const json = {
        service_a: {
          constructor: A,
          autowire: false,
          args: [ 'a', '@service_b', 'c' ],
        },
      };

      const setArguments = sinon.spy();
      const definition = { setArguments };

      const register = sinon.stub().returns(definition);
      const container = { register };


      const loader = new JsonLoader(container);

      loader.load(json);

      expect(register.calledOnce).to.be.true;
      expect(register.calledWith('service_a', A)).to.be.true;
      expect(setArguments.calledOnce).to.be.true;
      expect(setArguments.getCall(0).args[0][0]).to.equal('a');
      expect(setArguments.getCall(0).args[0][1].getServiceId()).to.equal('service_b');
      expect(setArguments.getCall(0).args[0][2]).to.equal('c');
    });

    it('can add tags', function() {
      class A {}
      const json = {
        service_a: {
          constructor: A,
          tags: [ 'foo', 'bar' ],
        },
      };

      const addTag = sinon.spy();
      const definition = { addTag };

      const autowire = sinon.stub().returns(definition);
      const container = { autowire };

      const loader = new JsonLoader(container);

      loader.load(json);

      expect(addTag.calledWith('foo')).to.be.true;
      expect(addTag.calledWith('bar')).to.be.true;
    });
  });

  describe('integration test', function() {
    it('works', function() {
      class A {}
      class B {
        woof() { return 'woof'; }
      }
      class C {
        constructor(B) { this.B = B; }
        getB() { return this.B; }
      }
      class D {
        constructor(service_c) { this.c = service_c; }
        getC() { return this.c; }
      }
      const json = {
        service_a: A,
        alias_a: '@service_a',
        service_b: {
          constructor: B,
          tags: [ 'bee' ],
        },
        service_c: {
          constructor: C,
          autowire: false,
          args: [ '@service_b' ]
        },
        service_d: D,
      };


      const container = new ServiceContainer();
      const loader = new JsonLoader(container);

      loader.load(json);
      container.compile();

      expect(container.get('service_d').getC().getB().woof()).to.equal('woof');
    });
  });
});
