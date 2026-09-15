import { describe, expect, it } from "vitest";
import {
  MOCK_USERS,
  mockUserForEmail,
  parseMockUser,
  serializeMockUser,
} from "@/lib/auth/mock";

describe("mock auth user helpers", () => {
  it("round-trips a serialized mock user", () => {
    const serialized = serializeMockUser(MOCK_USERS.google);
    const parsed = parseMockUser(serialized);
    expect(parsed).toEqual({
      id: MOCK_USERS.google.id,
      email: MOCK_USERS.google.email,
      name: MOCK_USERS.google.name,
      avatarUrl: null,
    });
  });

  it("returns null for missing input", () => {
    expect(parseMockUser(undefined)).toBeNull();
    expect(parseMockUser(null)).toBeNull();
    expect(parseMockUser("")).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseMockUser("not-json")).toBeNull();
    expect(parseMockUser(encodeURIComponent("{broken"))).toBeNull();
  });

  it("returns null when id is missing or empty", () => {
    expect(parseMockUser(encodeURIComponent(JSON.stringify({ email: "a@b.com" })))).toBeNull();
    expect(parseMockUser(encodeURIComponent(JSON.stringify({ id: "" })))).toBeNull();
    expect(parseMockUser(encodeURIComponent(JSON.stringify({ id: 42 })))).toBeNull();
  });

  it("derives a deterministic id from an email", () => {
    const first = mockUserForEmail("Jane.Doe@Example.com");
    const second = mockUserForEmail("Jane.Doe@Example.com");
    expect(first.id).toBe(second.id);
    expect(first.id).toBe("mock-jane-doe-example-com");
  });
});
