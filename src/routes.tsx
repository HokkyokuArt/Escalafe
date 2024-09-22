import { createBrowserRouter, Navigate } from "react-router-dom";
import ErrorPage from "./pages/ErrorPage";
import BaseComponent from "./components/BaseComponent";

export const routes = createBrowserRouter([
    {
        path: '/',
        element: <BaseComponent />,
        errorElement: <ErrorPage />,
        children: [
            {
                path: '',
                element: <Navigate to={'home'} />,
                id: '_redirectHome'
            },
            {
                path: 'home',
                element: <h1>HOME</h1>,
                id: 'Home',
            },
            {
                path: 'pessoas',
                element: <h1>Pessoas</h1>,
                id: 'Pessoas',
            },
            {
                path: 'funcoes',
                element: <h1>Funções</h1>,
                id: 'Funções',
            },
        ]
    }
]);
