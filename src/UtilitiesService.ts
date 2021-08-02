
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
}