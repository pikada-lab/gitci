import { Commit } from "../domains/git/Commit";

describe("Commit", () => {

    describe("setBranch", () => {
        it("should by dev", () => {
            expect(new Commit().setBranch("dev").branch[0]).toEqual("dev");
        });
    });
    describe("setTag", () => {

        it("should by v1", () => {
            expect( new Commit().setTag("v1").tag ).toEqual("v1");
        }); 
    });
});