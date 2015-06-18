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

    it('should handle NaN watch value', function() {
      // since NaN are not equal to itself, if a watch returns a NaN, it may stay dirty forever.
      // to avoid infinite looping for NaN watch we should explpicitely check for NaN watcher
      scope.number = 0/0;
      scope.counter = 0;

      scope.$watch(
        function(scope) {return scope.number;},
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
      // scope.$digest();
      // expect(scope.counter).toBe(1);
    });


    it('should $eval function and return result', function() {
      scope.value = 42;

      var result = scope.$eval(function(scope) {
        return scope.value;
      })

      expect(result).toBe(42);
    });


    it('should $apply function and start digest cycle', function() {
      scope.aValue = 'someValue';
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$apply(function(scope) {
        scope.aValue = 'someOtherValue';
      });

      expect(scope.counter).toBe(2);

    });

    it('should defer function passed to $evalAsync but in current $digest', function() {
      scope.aValue = [1,2,3];
      scope.evalAsyncEvaluated = false;
      scope.evalAsyncEvaluatedImmediately = false;

      scope.$watch(
        function(scope) {return scope.aValue;},
        function(newValue, oldValue, scope) {
          scope.$evalAsync(function(scope) {
            scope.evalAsyncEvaluated = true;
          });

          scope.evalAsyncEvaluatedImmediately = scope.evalAsyncEvaluated;
        }
      );

      scope.$digest();
      expect(scope.evalAsyncEvaluated).toBe(true);
      expect(scope.evalAsyncEvaluatedImmediately).toBe(false);

    });

    it('should $evalAsync function added by watch function', function() {
      scope.aValue = [1,2,3];
      scope.asyncEvaluated = false;

      scope.$watch(
        function(scope) {
          if(!scope.asyncEvaluated) {
            scope.$evalAsync(function() {
              scope.asyncEvaluated = true;
            });
          }
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {}
      );


      scope.$digest();

      expect(scope.asyncEvaluated).toBe(true);
    });


    it('executes $evalAsync function even when watch is not dirty', function() {
      scope.aValue = [1,2,3];
      scope.asyncEvaluatedTimes = 0;

      scope.$watch(
        function() {
          if(scope.asyncEvaluatedTimes < 2) {
            scope.$evalAsync(function() {
              scope.asyncEvaluatedTimes++;
            });
          }
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {}
      );

      scope.$digest();

      expect(scope.asyncEvaluatedTimes).toBe(2);
    });


    it('should terminate if the watch always has $evalAsync by watch function', function() {
      scope.aValue = [1,2.3];

      scope.$watch(
        function(scope) {
          scope.$evalAsync(function() {

          });
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {

        }
      );

      expect(function() { scope.$digest();}).toThrow();
    });

    it('should validate $$phase field whose value is the current digest phase',
      function() {
        scope.aValue = [1,2,3];
        scope.phaseInWatchFunction = undefined;
        scope.phaseInListenerFunction = undefined;
        scope.phaseInApplyFunction = undefined;

        scope.$watch(
          function(scope) {
            scope.phaseInWatchFunction = scope.$$phase;
            return scope.aValue;
          },
          function(newValue, oldValue, scope) {
            scope.phaseInListenerFunction = scope.$$phase;
          }
        );

        scope.$apply(function() {
          scope.phaseInApplyFunction = scope.$$phase;
        });

        expect(scope.phaseInWatchFunction).toBe('$digest');
        expect(scope.phaseInListenerFunction).toBe('$digest');
        expect(scope.phaseInApplyFunction).toBe('$apply');
      });

      it('should schedule a digest in $evalAsync', function(done) {
        scope.aValue = "abc";
        scope.counter = 0;

        scope.$watch(
          function(scope) { return scope.aValue},
          function(newValue, oldValue, scope) {
            scope.counter++;
          }
        );

        scope.$evalAsync(function(scope) {

        });

        expect(scope.counter).toBe(0);

        setTimeout(function() {
          expect(scope.counter).toBe(1);
          done();
        }, 50);
      });

      it('should allow async $apply with $applyAsync', function(done) {
        scope.counter = 0;
        scope.aValue = 'abc';

        scope.$watch(
          function(scope) {return scope.aValue;},
          function(newValue, oldValue, scope) {
            scope.counter++;
          }
        );

        scope.$digest();
        expect(scope.counter).toBe(1);

        scope.$applyAsync(function(scope) {
          scope.aValue = "xyz";
        });

        // scope.counter shouldn't increment as applyAsync function
        // is not called immediately
        expect(scope.counter).toBe(1);

        setTimeout(function() {
          expect(scope.counter).toBe(2);
          done();
        }, 50);
      });

      it('never execute $applAsync\'ed function in the current digest cycle'
        , function(done) {
        scope.aValue = [1,2,3];
        scope.asyncApplied = false;

        scope.$watch(
          function(scope) {return scope.aValue;},
          function(newValue, oldValue, scope) {
            scope.$applyAsync(function(scope) {
              scope.asyncApplied = true;
            });

          }
        );

        scope.$digest();
        expect(scope.asyncApplied).toBe(false);
        setTimeout(function() {
          expect(scope.asyncApplied).toBe(true);
          done();
        }, 50);

      });

      it('coalesces many calls to $applyAsync', function(done) {
        scope.counter = 0;

        scope.$watch(
          function(scope) {
            scope.counter++;
            return scope.aValue;
          },
          function (newValue, oldValue, scope) {

          }
        );

        scope.$applyAsync(function(scope) {
          scope.aValue = 'abc';
        });

        scope.$applyAsync(function(scope) {
          scope.aValue = 'def';
        });

        setTimeout(function() {
          expect(scope.counter).toBe(2);
          done();
        }, 50);
      });

  });
});
