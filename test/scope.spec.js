'use strict';

describe('test Scope', function() {
  it('should construct Scope and use it as an object', function() {
    var scope = new Scope();
    scope.aProperty = 1;

    expect(scope.aProperty).toBe(1);
  });

  describe('test digest', function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it('should call the listener function of a watch on first $digest', function() {
      var watchFn = function() {
        return 'wat';
      };

      var listenerFn = jasmine.createSpy();

      scope.$watch(watchFn, listenerFn);

      scope.$digest();

      expect(listenerFn).toHaveBeenCalled();
    });

    it('should call watch function with scope as a parameter', function() {
      var watchFn = jasmine.createSpy();
      var listenerFn = function() {};

      scope.$watch(watchFn, listenerFn);

      scope.$digest();


      expect(watchFn).toHaveBeenCalledWith(scope);
    });

    it('should call listener function when the watched calue changes', function() {

      scope.someValue = 'a';
      scope.counter = 0;

      scope.$watch(
        function(scope) {return scope.someValue;},
        function(newValue, oldValue, scope) { scope.counter++;}
      );

      expect(scope.counter).toBe(0);

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.someValue = 'b';
      expect(scope.counter).toBe(1);

      scope.$digest();
      expect(scope.counter).toBe(2);


    });

    it('should call listener function when watch value is not initialized', function() {
      scope.counter = 0;

      scope.$watch(
        function(scope) {return scope.someValue;},
        function(newValue, oldValue, scope) { scope.counter++;}
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

    });

    it('should call listener with new value as old value the first time', function() {
      scope.someValue = 123;

      var oldValueGiven;

      scope.$watch(
        function(scope) {return scope.someValue},
        function(newValue, oldValue, scope){oldValueGiven = oldValue; }
      );

      scope.$digest();
      expect(oldValueGiven).toBe(123);

    });

    it('should check that it may have watchers without listener function', function() {
      var watchFn = jasmine.createSpy().and.returnValue('something');
      scope.$watch(watchFn);

      scope.$digest();

      expect(watchFn).toHaveBeenCalled();
    });

  });
});
