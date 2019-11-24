import machine from "./machine";
export const options = {
  devTools: true,
  context: {
    ...machine.context,
    entities: {
      pinksquare: {
        id: "pinksquare",
        x: 55,
        y: 25,
        type: "text",
        body: "blah blah"
      }
    }
  }
};
