import React, { useEffect, useRef } from "react";
import { HotkeysProvider } from "@blueprintjs/core";
import { createHashRouter, RouterProvider } from "react-router-dom";

import "./Routes.scss";
import { Main } from "./component/main";

const router = createHashRouter([
  {
    path: "",
    element: <Main />,
  },
]);

export const Routes = () => {
  try {
    return (
      <HotkeysProvider>
        <RouterProvider router={router} />
      </HotkeysProvider>
    );
  } catch (e) {
    console.error(e);
    alert("Top level error" + e + " - " + e.stack);
  }
};
