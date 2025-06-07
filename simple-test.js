// Simple test script to verify test execution
import assert from 'assert';

// Simple test function
function add(a, b) {
  return a + b;
}

// Run test
console.log('Running simple test...');
assert.strictEqual(add(1, 2), 3, 'Addition should work correctly');
console.log('✓ Test passed!');
