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

    it('should trigger chained watchers in the same digest', function() {
      scope.name = 'ashish';

      scope.$watch(
        function(scope) { return scope.nameUpper;},
        function(newValue, oldValue, scope) {
          if(newValue) {
            scope.initial = newValue.substring(0,1) + '.';
          }
        }
      );

      scope.$watch(
        function(scope) { return scope.name;},
        function(newValue, oldValue, scope) {
          if(newValue) {
            scope.nameUpper = newValue.toUpperCase();
          }
        }
      );

      scope.$digest();
      expect(scope.initial).toBe('A.')

      scope.name = 'bob';
      scope.$digest();
      expect(scope.initial).toBe('B.');
    });


    it('should give up on the watches after 10 iterations', function() {
      scope.counterA = 0;
      scope.counterB = 0;

      scope.$watch(
        function(scope) {return scope.counterA;},
        function(newValue, oldValue, scope) {
          scope.counterB++;
        }
      );


      scope.$watch(
        function(scope) { return scope.counterB;},
        function(newValue, oldValue, scope) {
          scope.counterA++;
        }
      );

      expect((function() {scope.$digest(); })).toThrow();
    });

    it('should end digest when the last watch is clean', function() {
      scope.array = _.range(100);
      var watchExecutions = 0;

      _.times(100, function(i) {
        scope.$watch(
          function(scope) {
            watchExecutions++;
            return scope.array[i];
          },
          function(newValue, oldValue, scope) {

          }
        );
      });

      scope.$digest();
      expect(watchExecutions).toBe(200);

      scope.array[10] = 420;
      scope.$digest();
      expect(watchExecutions).toBe(311);


    });

    it('should compare based on value if enabled', function() {
      scope.aValue = [1,2,3];
      scope.counter = 0;

      scope.$watch(
        function(scope) {return scope.aValue},
        function(newValue, oldValue, scope) {
          scope.counter++;
        },
        true
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.aValue.push(4);
      scope.$digest();
      expect(scope.counter).toBe(2);
    });
  });
});