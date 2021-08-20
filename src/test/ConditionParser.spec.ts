import { Commit } from "../domains/git/Commit";
import { ConditionParser } from "../domains/job/strategy/ConditionParser";

describe("ConditionParser", () => {
  describe("$branch like dev", () => {
    it("should by true", () => {
      expect(
        ConditionParser("$branch like dev").execute(
          new Commit().setBranch("dev")
        )
      ).toBe(true);
    });
    it("should by false", () => {
      expect(
        ConditionParser("$branch like dev").execute(
          new Commit().setBranch("master")
        )
      ).toBe(false);
    });
  });
  describe("$tag like test", () => {
    it("should by true", () => {
      expect(
        ConditionParser("$tag like test").execute(new Commit().setTag("test"))
      ).toBe(true);
    });
    it("should by false", () => {
      expect(
        ConditionParser("$tag like test").execute(
          new Commit().setTag("release")
        )
      ).toBe(false);
    });
  });

  describe("$tag not like test", () => {
    it("should by false", () => {
      expect(
        ConditionParser("$tag not like test").execute(
          new Commit().setTag("test")
        )
      ).toBe(false);
    });
    it("should by true", () => {
      expect(
        ConditionParser("$tag not like test").execute(
          new Commit().setTag("release")
        )
      ).toBe(true);
    });
    it("should by false", () => {
      expect(
        ConditionParser("!($tag like test)").execute(
          new Commit().setTag("test")
        )
      ).toBe(false);
    });
    it("should by true", () => {
      expect(
        ConditionParser("!($tag like test)").execute(
          new Commit().setTag("release")
        )
      ).toBe(true);
    });
  });

  describe("OR", () => {
    it("should by true", () => {
      expect(
        ConditionParser("$tag like test OR $tag like release").execute(
          new Commit().setTag("release")
        )
      ).toBe(true);
    });
    it("should by false", () => {
      expect(
        ConditionParser("$tag like test OR $tag like release").execute(
          new Commit().setTag("prod")
        )
      ).toBe(false);
    });
    it("should by true", () => {
      expect(
        ConditionParser("$branch like dev OR $tag like test").execute(
          new Commit().setBranch("dev")
        )
      ).toBe(true);
    });
  });

  describe("AND", () => {
    it("should by false", () => {
      expect(
        ConditionParser("$tag like test AND $tag like release").execute(
          new Commit().setTag("release")
        )
      ).toBe(false);
    });
    it("should by false", () => {
      expect(
        ConditionParser("$tag like test AND $tag like release").execute(
          new Commit().setTag("prod")
        )
      ).toBe(false);
    });
    it("should by false", () => {
      expect(
        ConditionParser("$branch like dev AND $tag like test").execute(
          new Commit().setBranch("dev")
        )
      ).toBe(false);
    });
    it("should by true", () => {
      expect(
        ConditionParser("$branch like dev AND $tag like test").execute(
          new Commit().setBranch("dev").setTag("test")
        )
      ).toBe(true);
    });
  });
});
