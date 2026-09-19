import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "@/app/layouts/RootLayout";
import { StudioLayout } from "@/app/layouts/StudioLayout";
import { NotFoundPage } from "@/app/routes/NotFoundPage";
import { RouteErrorBoundary } from "@/app/routes/RouteErrorBoundary";
import { DashboardPage } from "@/pages/DashboardPage";
import { DetectionPage } from "@/pages/DetectionPage";
import { GamePage } from "@/pages/GamePage";
import { JsonEditorPage } from "@/pages/JsonEditorPage";
import { LandingPage } from "@/pages/LandingPage";
import { StudioPage } from "@/pages/StudioPage";
import { UploadPage } from "@/pages/UploadPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: "studio",
        element: <StudioPage />,
      },
      {
        path: "upload",
        element: <UploadPage />,
      },
      {
        path: "projects/:projectId",
        element: <StudioLayout />,
        children: [
          {
            index: true,
            element: <Navigate replace to="studio" />,
          },
          {
            path: "studio",
            element: <StudioPage />,
          },
          {
            path: "upload",
            element: <UploadPage />,
          },
          {
            path: "detect",
            element: <DetectionPage />,
          },
          {
            path: "json",
            element: <JsonEditorPage />,
          },
          {
            path: "play",
            element: <GamePage />,
          },
        ],
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
