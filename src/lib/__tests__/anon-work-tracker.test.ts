import { test, expect, beforeEach, describe } from "vitest";
import {
  setHasAnonWork,
  getHasAnonWork,
  getAnonWorkData,
  clearAnonWork,
} from "@/lib/anon-work-tracker";

beforeEach(() => {
  sessionStorage.clear();
});

describe("setHasAnonWork", () => {
  test("stores messages and file system data when messages are present", () => {
    const messages = [{ role: "user", content: "hello" }];
    const fileSystemData = { "/": { type: "directory" } };
    setHasAnonWork(messages, fileSystemData);

    expect(getHasAnonWork()).toBe(true);
  });

  test("stores data when fileSystemData has more than root entry", () => {
    const messages: any[] = [];
    const fileSystemData = {
      "/": { type: "directory" },
      "/App.jsx": { type: "file", content: "export default () => <div/>" },
    };
    setHasAnonWork(messages, fileSystemData);

    expect(getHasAnonWork()).toBe(true);
  });

  test("does not store when no messages and only root in filesystem", () => {
    setHasAnonWork([], { "/": { type: "directory" } });

    expect(getHasAnonWork()).toBe(false);
  });

  test("does not store when both messages and fileSystemData are empty", () => {
    setHasAnonWork([], {});

    expect(getHasAnonWork()).toBe(false);
  });

  test("persists the exact messages and fileSystemData", () => {
    const messages = [{ role: "user", content: "create a button" }];
    const fileSystemData = { "/App.jsx": "code" };
    setHasAnonWork(messages, fileSystemData);

    const data = getAnonWorkData();
    expect(data?.messages).toEqual(messages);
    expect(data?.fileSystemData).toEqual(fileSystemData);
  });
});

describe("getHasAnonWork", () => {
  test("returns false when nothing is stored", () => {
    expect(getHasAnonWork()).toBe(false);
  });

  test("returns true after setting anon work", () => {
    setHasAnonWork([{ role: "user", content: "x" }], {});
    expect(getHasAnonWork()).toBe(true);
  });

  test("returns false after clearing", () => {
    setHasAnonWork([{ role: "user", content: "x" }], {});
    clearAnonWork();
    expect(getHasAnonWork()).toBe(false);
  });
});

describe("getAnonWorkData", () => {
  test("returns null when no data stored", () => {
    expect(getAnonWorkData()).toBeNull();
  });

  test("returns null when data key is missing but flag is set", () => {
    sessionStorage.setItem("uigen_has_anon_work", "true");
    expect(getAnonWorkData()).toBeNull();
  });

  test("returns null when stored data is invalid JSON", () => {
    sessionStorage.setItem("uigen_anon_data", "not-json{{{");
    expect(getAnonWorkData()).toBeNull();
  });

  test("returns parsed data when valid JSON is stored", () => {
    const payload = { messages: [{ role: "user" }], fileSystemData: { "/": {} } };
    sessionStorage.setItem("uigen_anon_data", JSON.stringify(payload));
    expect(getAnonWorkData()).toEqual(payload);
  });
});

describe("clearAnonWork", () => {
  test("removes both storage keys", () => {
    setHasAnonWork([{ role: "user", content: "x" }], {});
    clearAnonWork();

    expect(getHasAnonWork()).toBe(false);
    expect(getAnonWorkData()).toBeNull();
  });

  test("does not throw when nothing is stored", () => {
    expect(() => clearAnonWork()).not.toThrow();
  });
});
