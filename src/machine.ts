import { Machine, assign } from "xstate";
import { string } from "prop-types";
import { produce } from "immer";
import uuid4 from "uuid/v4";
type Entity = {
  id: string;
  x: number;
  y: number;
  type: string;
  body: any;
};
type Context = {
  hoverId: string;
  deltaX: number;
  deltaY: number;
  mouseX: number;
  mouseY: number;
  worldX: number;
  worldY: number;
  clickedX: number;
  clickedY: number;
  panX: number;
  panY: number;
  scale: number;
  entities: { [key: string]: Entity };
  selectedIds: string[];
};
type MouseEventProxy = {
  clientX: number;
  clientY: number;
  id: string;
  entity: string;
  shiftKey: boolean;
};
type PointerEvent =
  | ({
      type: "mousemove";
    } & MouseEventProxy)
  | ({
      type: "mousedown";
    } & MouseEventProxy)
  | ({
      type: "mouseup";
    } & MouseEventProxy);
type Event =
  | PointerEvent
  | ({
      type: "zoom";
      scale: number;
    })
  | ({
      type: "beginPlacingPin";
    })
  | ({
      type: "beginDrawingLine";
    });

export default Machine<Context, Event>(
  {
    id: "corkboard",
    initial: "monitoringMouse",
    context: {
      entities: {},
      hoverId: "",
      selectedIds: [],
      deltaX: 0,
      deltaY: 0,
      mouseX: 0,
      mouseY: 0,
      worldX: 0,
      worldY: 0,
      clickedX: 0,
      clickedY: 0,
      panX: 0,
      panY: 0,
      scale: 1.0
    },
    type: "parallel",
    states: {
      monitoringMouse: {
        on: {
          mousemove: {
            actions: "updateMouseCoordinates"
          }
        }
      },
      reactingToMouse: {
        initial: "idle",
        states: {
          idle: {
            on: {
              mousedown: [
                {
                  target: "selecting",
                  cond: "isShiftHeld"
                },
                {
                  target: "panning",
                  cond: "isHoveringCorkboard"
                },
                {
                  target: "moving",
                  cond: "isHoveringDraggable"
                }
              ],
              beginPlacingPin: "placingPin",
              beginLinking: "linking",
              zoom: { actions: assign({ scale: (s, e) => e.scale }) }
            }
          },
          moving: {
            entry: assign({ selectedIds: e => [...e.selectedIds, e.hoverId] }),
            on: {
              mouseup: {
                target: "idle",
                actions: assign({ selectedIds: e => [] })
              },
              mousemove: {
                actions: "movePicked"
              }
            }
          },
          panning: {
            on: {
              mouseup: {
                target: "idle"
              },
              mousemove: {
                actions: "panMouse"
              }
            }
          },
          placingPin: {
            on: {
              mouseup: {
                target: "idle",
                actions: ["placePinUnderMouse"]
              }
            }
          },
          selecting: {
            on: {
              mouseup: {
                target: "idle",
                actions: assign({
                  selectedIds: s => [...s.selectedIds, s.hoverId]
                })
              }
            }
          },
          linking: {
            initial: "firstPoint",
            states: {
              firstPoint: {
                on: {
                  mouseup: [
                    {
                      target: "secondPoint",
                      actions: assign({ selectedIds: e => [e.hoverId] }),
                      cond: "isHoveringDraggable"
                    },
                    {
                      target: "done"
                    }
                  ]
                }
              },
              secondPoint: {
                on: {
                  mousedown: [
                    {
                      target: "done",
                      actions: "linkEntities",
                      cond: "isHoveringDraggable"
                    },
                    { target: "done" }
                  ]
                }
              },
              done: { type: "final" }
            },
            onDone: "idle",
            exit: ["resetSelection"]
          }
        }
      }
    }
  },
  {
    guards: {
      isHoveringCorkboard: s => s.hoverId === "corkboard",
      isHoveringDraggable: s => s.hoverId !== "" && s.hoverId !== "corkboard",
      isShiftHeld: (s, e) => e.type === "mousedown" && e.shiftKey
    },
    actions: {
      updateMouseCoordinates: assign({
        deltaX: (s, e: PointerEvent) => e.clientX - s.mouseX,
        deltaY: (s, e: PointerEvent) => e.clientY - s.mouseY,
        mouseX: (s, e: PointerEvent) => e.clientX,
        mouseY: (s, e: PointerEvent) => e.clientY,
        hoverId: (s, e: PointerEvent) => e.entity || "",
        worldX: s => (s.mouseX - s.panX) / s.scale,
        worldY: s => (s.mouseY - s.panY) / s.scale
      }),
      placePinUnderMouse: assign({
        entities: e =>
          produce(e.entities, s => {
            const entity = {
              x: e.worldX,
              y: e.worldY,
              id: uuid4(),
              body: "!",
              type: "pin"
            };
            s[entity.id] = entity;
            return s;
          })
      }),
      placeLine: assign({
        entities: e =>
          produce(e.entities, s => {
            const from = {
              x: e.clickedX,
              y: e.clickedY
            };
            const to = {
              x: e.worldX,
              y: e.worldY
            };
            const entity = {
              x: from.x,
              y: from.y,
              id: uuid4(),
              body: { from, to },
              type: "line"
            };
            s[entity.id] = entity;
            return s;
          })
      }),
      resetSelection: assign({
        selectedIds: s => []
      }),
      panMouse: assign({
        panX: s => s.panX + s.deltaX,
        panY: s => s.panY + s.deltaY
      }),
      movePicked: assign({
        entities: s =>
          produce(s.entities, e => {
            s.selectedIds.map(id => {
              const entity = e[id];
              entity.x = entity.x + s.deltaX;
              entity.y = entity.y + s.deltaY;
              return e;
            });
          })
      }),
      linkEntities: assign({
        entities: e =>
          produce(e.entities, s => {
            s[e.selectedIds[0]].links = [e.hoverId];
            return s;
          })
      })
    }
  }
);
