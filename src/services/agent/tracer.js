/**
 * Agent Tracer — Step logging and trace recording
 * Records each step of the agent pipeline for transparency.
 */

export class Tracer {
  constructor() {
    this.steps = [];
  }

  log(stepName, input, output, reasoning = '') {
    this.steps.push({
      timestamp: new Date().toISOString(),
      step: stepName,
      input,
      output,
      reasoning,
    });
  }

  getTrace() {
    return [...this.steps];
  }

  clear() {
    this.steps = [];
  }
}

export default Tracer;
