const obj = {};
obj.circular = obj;

try {
  JSON.stringify(obj, (key, value) => {
    if (value === obj && key !== "") {
       return "[Circular]";
    }
    return value;
  });
  console.log("SUCCESS");
} catch(e) {
  console.log("FAIL", e.message);
}

class HTMLElement {}
class FiberNode {}
const el = new HTMLElement();
const fiber = new FiberNode();
el.__reactFiber_abc = fiber;
fiber.stateNode = el;

try {
  const cache = new WeakSet();
  JSON.stringify(el, (k, v) => {
    if (typeof v === 'object' && v !== null) {
       if (cache.has(v)) return "[Circ]";
       cache.add(v);
    }
    return v;
  });
  console.log("SUCCESS FIBER");
} catch(e) {
  console.log("FAIL FIBER", e.message);
}
