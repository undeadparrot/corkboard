import { useMachine } from "@xstate/react";
import React from "react";
import ReactDOM from "react-dom";
import machine from "./machine";
import { options } from "./options";
import { Statebuttons } from "./Statebuttons";
import "./styles.css";

function App() {
  const [current, send] = useMachine(machine, options);
  const corkboardRef = React.useRef(null);
  const {
    hoverId,
    mouseX,
    mouseY,
    worldX,
    worldY,
    panX,
    panY,
    scale,
    entities
  } = current.context;
  const width = 500;
  const height = 400;

  function sanitizeEvent(e) {
    const entity = e.target.classList.contains("draghandle")
      ? e.target.dataset.entity
      : undefined;
    return {
      type: e.type,
      id: e.target.id,
      entity: entity,
      clientX: e.clientX - corkboardRef.current.getBoundingClientRect().x,
      clientY: e.clientY - corkboardRef.current.getBoundingClientRect().y,
      shiftKey: e.shiftKey
    };
  }

  return (
    <div className="App">
      <h2>Corkboard with XState + React</h2>
      <div className="buttonbar">
        <button
          className="bubble"
          onClick={() => send({ type: "beginPlacingPin" })}
        >
          📌Pin
        </button>
        <button
          className="bubble"
          onClick={() => send({ type: "beginLinking" })}
        >
          🔗Link
        </button>
        <button className="bubble">📝Note</button>
        <input
          type="range"
          value={scale}
          min={0.5}
          max={5}
          step={0.1}
          className="inset"
          onChange={e => send({ type: "zoom", scale: e.target.value })}
        />
      </div>

      <svg
        id="corkboard"
        ref={corkboardRef}
        className="inset draghandle"
        data-entity="corkboard"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={e => send(sanitizeEvent(e))}
        onMouseDown={e => send(sanitizeEvent(e))}
        onMouseUp={e => send(sanitizeEvent(e))}
        onWheel={e =>
          send({ type: "zoom", scale: scale + (e.deltaY > 0 ? -0.2 : 0.2) })
        }
      >
        <text
          style={{ pointerEvents: "none", userSelect: "none" }}
          x={5}
          y={15}
          fontSize={9}
        >
          {Math.ceil(mouseX)} {Math.ceil(mouseY)}
        </text>
        <text
          style={{ pointerEvents: "none", userSelect: "none" }}
          x={5}
          y={25}
          fontSize={9}
        >
          {Math.ceil(worldX)} {Math.ceil(worldY)}
        </text>
        <text
          style={{ pointerEvents: "none", userSelect: "none" }}
          x={5}
          y={35}
          fontSize={9}
        >
          {Math.ceil(panX)} {Math.ceil(panY)}
        </text>
        <text
          style={{ pointerEvents: "none", userSelect: "none" }}
          x={5}
          y={height - 5}
          fontSize={9}
        >
          {current.context.hoverId}
        </text>
        <g transform={`translate(${panX},${panY}) scale(${scale},${scale})`}>
          <line x1={-5} y1={0} x2={11} y2={0} stroke="silver" strokeWidth={2} />
          <line x1={0} y1={-5} x2={0} y2={11} stroke="silver" strokeWidth={2} />
          <line
            x1={-5}
            y1={-5}
            x2={15}
            y2={15}
            stroke="silver"
            strokeWidth={2}
          />
          {Object.keys(entities).map(key => {
            const entity = entities[key];
            return (
              <>
                <g transform={`translate(${entity.x},${entity.y})`}>
                  {entity.type === "image" && (
                    <image
                      x={0 - 101}
                      y={5}
                      width={200}
                      style={{ pointerEvents: "none" }}
                      href={entity.body}
                    />
                  )}
                  {(entity.links || []).map(otherId => (
                    <line
                      data-entity={entity.id}
                      stroke="gray"
                      strokeWidth={2}
                      x1={0}
                      y1={0}
                      x2={entities[otherId].x - entity.x}
                      y2={entities[otherId].y - entity.y}
                    />
                  ))}
                  {entity.type === "text" && (
                    <text
                      data-entity={entity.id}
                      x={0}
                      y={5}
                      text-anchor="middle"
                      alignment-baseline="hanging"
                    >
                      {entity.body}
                    </text>
                  )}
                  <circle
                    className="draghandle"
                    data-entity={entity.id}
                    cx={0}
                    cy={0}
                    r={9}
                    fill={
                      current.context.selectedIds.includes(entity.id)
                        ? "white"
                        : "grey"
                    }
                  />
                </g>
              </>
            );
          })}
        </g>
      </svg>
      <div>
        <Statebuttons machine={machine} value={current.value} />
      </div>
      <pre className="">{JSON.stringify([current.context.selectedIds])}</pre>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
