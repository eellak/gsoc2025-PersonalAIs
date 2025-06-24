import { describe, expect, test, vi } from "vitest";
import { groupBy, errorToString, objectFlow } from "./utils";

describe("groupBy", () => {
  test("group by function key", () => {
    const items = [
      { id: 1, category: "A" },
      { id: 2, category: "B" },
      { id: 3, category: "A" },
      { id: 4, category: "C" },
    ];

    const result = groupBy(items, (item) => item.category);

    expect(result).toEqual({
      A: [
        { id: 1, category: "A" },
        { id: 3, category: "A" },
      ],
      B: [{ id: 2, category: "B" }],
      C: [{ id: 4, category: "C" }],
    });
  });

  test("group by string key", () => {
    const items = [
      { id: 1, category: "A" },
      { id: 2, category: "B" },
      { id: 3, category: "A" },
      { id: 4, category: "C" },
    ];

    const result = groupBy(items, "category");

    expect(result).toEqual({
      A: [
        { id: 1, category: "A" },
        { id: 3, category: "A" },
      ],
      B: [{ id: 2, category: "B" }],
      C: [{ id: 4, category: "C" }],
    });
  });

  test("group empty array", () => {
    const items: Array<{ id: number; category: string }> = [];

    const result = groupBy(items, "category");

    expect(result).toEqual({});
  });
});

describe("errorToString", () => {
  test("convert string error", () => {
    expect(errorToString("error message")).toBe("error message");
  });

  test("convert Error object", () => {
    const error = new Error("test error");
    expect(errorToString(error)).toBe("test error");
  });

  test("convert null error", () => {
    expect(errorToString(null)).toBe("unknown error");
  });

  test("convert undefined error", () => {
    expect(errorToString(undefined)).toBe("unknown error");
  });

  test("convert object error", () => {
    const obj = { message: "error object" };
    expect(errorToString(obj)).toBe('{"message":"error object"}');
  });
});

describe("objectFlow", () => {
  const testObj = {
    a: 1,
    b: 2,
    c: 3,
    d: 4,
  };

  test("map function", () => {
    const result = objectFlow(testObj).map((value) => value * 2);
    expect(result).toEqual({
      a: 2,
      b: 4,
      c: 6,
      d: 8,
    });
  });

  test("filter function", () => {
    const result = objectFlow(testObj).filter((value) => value % 2 === 0);
    expect(result).toEqual({
      b: 2,
      d: 4,
    });
  });

  test("forEach function", () => {
    const mockFn = vi.fn();
    objectFlow(testObj).forEach(mockFn);
    expect(mockFn).toHaveBeenCalledTimes(4);
  });

  test("some function: true case", () => {
    const result = objectFlow(testObj).some((value) => value > 3);
    expect(result).toBe(true);
  });

  test("some function: false case", () => {
    const result = objectFlow(testObj).some((value) => value > 10);
    expect(result).toBe(false);
  });

  test("every function: true case", () => {
    const result = objectFlow(testObj).every((value) => value > 0);
    expect(result).toBe(true);
  });

  test("every function: false case", () => {
    const result = objectFlow(testObj).every((value) => value > 2);
    expect(result).toBe(false);
  });

  test("find function", () => {
    const result = objectFlow(testObj).find((value) => value > 2);
    expect(result).toBe(3);
  });

  test("find function: no result", () => {
    const result = objectFlow(testObj).find((value) => value > 10);
    expect(result).toBeUndefined();
  });
});
