# Using the ServiceContainer

## Introduction
The [ServiceContainer](./lib/DependencyInjection/ServiceContainer.js) is meant to enable development practices 
in Inversion of Control.

## What does the ServiceContainer do?
The ServiceContainer is designed to be a singleton object from which all services in the application can be
fetched. Its design principles originate from the
[ServiceContainer](https://symfony.com/doc/current/service_container.html) from Symfony and
[Guice](https://github.com/google/guice) from Java.


## Creating a new Service
A service is simply a block of code encapsulated in a class, function, or closures. In short, it's just code.

Generally, services should be defined in the [`lib/`](../lib/) directory and should be written as stateless
Javascript modules:

`lib/Dog/Database.js`
```javascript
'use strict';

class DogDatabase {
  query() { /* */ }
}

module.exports = DogDatabase;
```


## Registering a Service
Registering the service should be done in files under the [`services/`](../services/) directory. Currently the
[container.js](../services/container.js) file is suited for this until it grows too big.


### Registering an already-built service
For full control of the construction of a service, use the `register()` method.

`services/container.js`
```javascript
const service_container = new ServiceContainer();
service_container.set('dog_database', new DogDatabase());
```

This makes your service available as a singleton with the service id of `dog_database`, with the `get()` method:

```javascript
service_container.get('dog_database').query();
```

### Registering with a factory
You can register a callback instead of the actual service itself, using the `registerFactory()` method.

`services/container.js`
```javascript
const service_container = new ServiceContainer();
service_container.registerFactory('dog_database', callback);
function callback(service_container) {
  return new DogDatabase(service_container.get('db_conn'));
}
```

The callback must be a function that accepts exactly one argument; an instance of the service container.


### Registering with definitions
Another way to register new services; use the `register()` method.

`services/container.js`
```javascript
const service_container = new ServiceContainer();
service_container.register('dog_database', DogDatabase);
```

The `register()` method accepts two arguments; the service_id for the service and an object constructor/class
definition. 


### Registering the easy way
This is syntactic sugar for registering with definitions.

`services/container.js`
```javascript
const service_container = new ServiceContainer();
service_container.registerSimple('dog_database', DogDatabase, ['dependent.service_id']);
```


## Handling Services with Dependencies
The true power of the ServiceContainer comes out when you have services that have dependencies (Inversion of
Control design):

`lib/DogeSystem.js`
```javascript
class DogeSystem {
  constructor(DogDatabase, Emailer) { /* .. */ }

  wow(dog_id) {
    return this.DogDatabase.query(dog_id)
      .then(dog => {
        this.Emailer.send(dog.bark());
      });
  }
}
```

Ordinarily, constructing such a service would be painful in normal Javascript code:

```javascript
const system = new DogeSystem(
  new Mailer(
    mailing_configuration,
    new AwsEmailAdapter(aws_settings),
  ),
  new DogDatabase(),
);
```

With the service container, this is easy:

```javascript
service_container.registerSimple('doge_system', DogSystem, ['mailer', 'dog_database']);
```

The third argument to the `ServiceContainer.registerSimple()` is a list of service ids. The `registerSimple()`
automatically knows to translate those strings to other services under-the-hood.


## Autowiring
Service dependencies can be configured to auto-magically wire themselves together! 

```javascript
class TopLevelService {
  constructor(Dependency1, Dependency2) { /* ... */ }
}

class Dependency1 {
  // ...
}
class Dependency2 {
  constructor(Dependency3) { /* ... */ }
}
class Dependency3 {
  // ...
}

container.register('Dependency1', Dependency1);
container.register('Dependency3', Dependency3);

container.autowire('Dependency2', Dependency2);
container.autowire('my_service', TopLevelService);
```

Autowiring requires that the constructor dependencies of a class are named exactly after service_ids within the 
service container.


## Compiler Passes
Compiler passes are a way of programmatically modifying services after the registration process, but before
the compilation process. This is useful when used in conjunction with `addMethodCall()` to finish construction
of services that are assembled with many mixins.

Consider this example:
```javascript
class Life {
  installSoul(soul) { /* ... */ }
}
class Human extends Life {
  constructor(Soul) {
    super();
    this.installSoul(Soul);
  }
}
class Dog extends Life {
  constructor(Soul) {
    super();
    this.installSoul(Soul);
  }
}
class Cat extends Life {
  constructor(Soul) {
    super();
    this.installSoul(Soul);
  }
}

service_container.autowire('Human', Human);
service_container.autowire('Dog', Dog);
service_container.autowire('Cat', Cat);
``` 

This example works well enough, but the constructor is repetitive and annoying to maintain.

```javascript
class Life {
  installSoul(soul) { /* ... */ }
}
class Human extends Life {}
class Dog extends Life {}
class Cat extends Life {}

class LifeInstallCompilerPass extends CompilerPass {
  process(service_container) {
    service_container.findTaggedServiceIds('living_thing').forEach(id => {
      const soul = service_container.get('SoulFactory').newSoul();
      service_container.getDefinition(id).addMethodCall('installSoul', soul);
    }); 
  }
}

service_container.autowire('Human', Human).addTag('living_thing');
service_container.autowire('Dog', Dog).addTag('living_thing');
service_container.autowire('Cat', Cat).addTag('living_thing');
service_container.addCompilerPass(new LifeInstallCompilerPass());
```

This makes adding new classes that extend `Life` easier. The `LifeInstallCompilerPass` handles the setter
injection by calling `installSoul` after the service has been constructed. This happens prior to any calls to
`service_container.get()`, so the returned service is still consistent.


## Cyclical Dependencies
Occasionally in your code you will run into situations where code components depend on each other, probably
by accident.

```javascript
class Foo {
  constructor(Bar) { /* ... */ }
}

class Bar {
  constructor(Foo) { /* ... */ }
}

service_container.autowire('Foo', Foo);
service_container.autowire('Bar', Bar);
```

The ServiceContainer will catch such scenarios on the compile step:

```javascript
service_container.compile(); // Throws Error: "cyclical service dependency detected on (Foo -> Bar -> Foo)"
```

### Breaking Cyclical Dependencies
_"OMG I have a cycle! This ServiceContainer sucks!"_

The intention of the ServiceContainer is not to solve cyclical dependencies, but to surface them. Such scenarios
are typically signs of problems in abstractions. Consider the following example:

```javascript
class Dog {
  constructor(Human) { this.owner = Human; }
  
  name() {
    return 'Rex';
  }
  
  bark() {
    return `Woof! I love my owner, ${this.owner.name()}`;
  }
}
class Human {
  constructor(Dog) { this.pet = Dog; }
  
  name() {
    return 'Jason';
  }
  
  hello() {
    return `Hello, I am ${this.name()} and this is my pet, ${this.pet.name()}.`;
  }
}

service_container.autowire('Dog', Dog);
service_container.autowire('Human', Human);

service_container.compile(); // uh oh.
```

In this case, there is a non-recursive cyclic dependency between the two services. You can consider extracting
their cross-dependencies into a separate, third service:

```javascript
class Dog {
  constructor(NamingService) { this.NamingService = NamingService; }
  
  name() {
    return this.NamingService.getDogName();
  }
  
  bark() {
    return `Woof! I love my owner, ${this.NamingService.getHumanName()}`;
  }
}
class Human {
  constructor(NamingService) { this.NamingService = NamingService; }
  
  name() {
    return this.NamingService.getHumanName();
  }
  
  hello() {
    return `Hello, I am ${this.name()} and this is my pet, ${this.NamingService.getDogName()}.`;
  }
}
class NamingService {
  getHumanName() { return 'Jason'; }
  getDogName() { return 'Rex'; }
}

service_container.autowire('Dog', Dog);
service_container.autowire('Human', Human);
service_container.autowire('NamingService', NamingService);

service_container.compile(); // Yay!
```

Not all cases will be this simple but you get the idea.


## Including the Service Container
In client application code, to use the service container simply require the [container.js](../services/container.js)
file.

`routes/controller.js`
```javascript
const service_container = require('../service/container');
```

Typically, client application code will include controllers, scripts, or other application entry points.


## Fetching a Service
Once you have required the service container, use the `get()` method to fetch the service.

```javascript
const doge_system = service_container.get('doge_system');
```

The service container magically handles all of the resolution of service dependencies, including (potentially)
highly nested services.


## Fetching Multiple Services at Once
Yep!

```javascript
const {
  DogeService,
  HelloWorld,
} = service_container.getAll(['DogeService', 'HelloWorld']);
```
