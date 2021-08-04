import { tmpdir } from "os";
import { join } from "path";

export class UtilitiesService {
  part() {
    return (Math.round(Math.random() * 999999)).toString(16)
  }
  keyGen() {
    return `${this.part()}-${this.part()}-${this.part()}-${this.part()}`;
  }
  IDGen() {
    return `${this.part()}}`;
  }

  getTempPath() {
    return join(tmpdir(), Math.round(Math.random() * 100000000).toString(16));
  }
}