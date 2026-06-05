import "./styles/base.css";
import { mountFloatingWidget } from "./windows/floating-widget/FloatingWidget";
import { mountLiuyaoFeature } from "./windows/liuyao-feature/LiuyaoFeature";

const route = window.location.hash.replace("#/", "");
const appRoot = document.getElementById("app");

if (!appRoot) {
  throw new Error("Missing #app root element.");
}

if (route === "floating") {
  mountFloatingWidget(appRoot);
} else if (route === "liuyao") {
  mountLiuyaoFeature(appRoot);
} else {
  mountFloatingWidget(appRoot);
}
