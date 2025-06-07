// Basic unit test for testing infrastructure
describe('Simple Test', () => {
  // Simple test function
  function add(a, b) {
    return a + b;
  }

  it('should correctly add two numbers', () => {
    expect(add(1, 2)).toBe(3);
  });

  it('should handle negative numbers', () => {
    expect(add(-1, -2)).toBe(-3);
  });

  it('should handle zero', () => {
    expect(add(0, 0)).toBe(0);
  });
});
