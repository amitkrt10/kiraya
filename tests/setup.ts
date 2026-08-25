import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom deliberately doesn't implement <dialog>'s showModal()/close() (see
// https://github.com/jsdom/jsdom/issues/3294) — every Drawer/Dialog in this
// codebase (components/ui/Drawer.tsx) relies on both, including close()
// firing a native "close" event for its onClose callback. Polyfilled once
// here rather than per test file, since any component test that opens a
// real Drawer needs this.
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

afterEach(() => {
  cleanup();
});
