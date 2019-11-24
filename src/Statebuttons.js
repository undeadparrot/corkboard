import React from "react";
export function Statebuttons({ machine, key, value }) {
  if (!machine.states) {
    return { key };
  }
  return Object.keys(machine.states).map(key => {
    const val = value ? value[key] : value;
    const classname = "statebuttons " + (value == key ? "inset" : "bubble");
    return (
      <div className={classname}>
        <div>{key}</div>
        <Statebuttons key={key} value={val} machine={machine.states[key]} />
      </div>
    );
  });
}
